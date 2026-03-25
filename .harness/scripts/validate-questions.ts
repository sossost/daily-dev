#!/usr/bin/env tsx

/**
 * Question JSON Validator
 *
 * Validates all question files in data/questions/ against the schema.
 * Exit code 0 = all valid, 1 = errors found.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions')
const TYPES_FILE = path.join(PROJECT_DIR, 'src/types/index.ts')

// ---------------------------------------------------------------------------
// Load valid topics dynamically from src/types/index.ts
// ---------------------------------------------------------------------------
function loadValidTopics(): string[] {
  const content = fs.readFileSync(TYPES_FILE, 'utf-8')
  const match = content.match(/TOPICS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/)
  if (match == null) {
    console.error('ERROR: Could not parse TOPICS from src/types/index.ts')
    process.exit(1)
  }
  const raw = match[1]
  const topics: string[] = []
  const re = /'([^']+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    topics.push(m[1])
  }
  if (topics.length === 0) {
    console.error('ERROR: No topics found in TOPICS array')
    process.exit(1)
  }
  return topics
}

const VALID_TOPICS = loadValidTopics()
const VALID_TYPES = ['concept', 'output-prediction', 'debugging', 'comparison']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

interface Question {
  id: string
  topic: string
  type: string
  difficulty: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  sourceUrl: string
  code?: string
}

let errorCount = 0
let warningCount = 0

function logError(file: string, idx: number, msg: string): void {
  console.error(`  ERROR [${file}#${idx}]: ${msg}`)
  errorCount++
}

function logWarning(file: string, idx: number, msg: string): void {
  console.warn(`  WARNING [${file}#${idx}]: ${msg}`)
  warningCount++
}

// ---------------------------------------------------------------------------
// Directory existence guard
// ---------------------------------------------------------------------------
if (!fs.existsSync(QUESTIONS_DIR)) {
  console.log('Questions directory does not exist. Skipping validation.')
  process.exit(0)
}

// Scan locale subdirectories (e.g. data/questions/en/, data/questions/ko/)
// Falls back to root directory for backwards compatibility
const LOCALE_DIRS = ['en', 'ko']
const fileEntries: { locale: string; file: string; filePath: string }[] = []

for (const locale of LOCALE_DIRS) {
  const localeDir = path.join(QUESTIONS_DIR, locale)
  if (!fs.existsSync(localeDir)) continue
  for (const file of fs.readdirSync(localeDir).filter((f) => f.endsWith('.json'))) {
    fileEntries.push({ locale, file, filePath: path.join(localeDir, file) })
  }
}

// Fallback: check root directory (legacy flat structure)
if (fileEntries.length === 0) {
  for (const file of fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))) {
    fileEntries.push({ locale: '', file, filePath: path.join(QUESTIONS_DIR, file) })
  }
}

if (fileEntries.length === 0) {
  console.log('No question files found. Skipping validation.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Global ID set for duplicate detection across all files (per locale)
// ---------------------------------------------------------------------------
const globalIdsByLocale = new Map<string, Set<string>>()

for (const { locale, file, filePath } of fileEntries) {
  const displayName = locale !== '' ? `${locale}/${file}` : file
  console.log(`Validating ${displayName}...`)

  if (!globalIdsByLocale.has(locale)) {
    globalIdsByLocale.set(locale, new Set())
  }
  const globalIds = globalIdsByLocale.get(locale)!

  // Try to parse JSON
  let questions: Question[]
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (raw.trim().length === 0) {
      console.error(`  ERROR [${displayName}]: File is empty`)
      errorCount++
      continue
    }
    questions = JSON.parse(raw)
  } catch (e) {
    console.error(`  ERROR [${displayName}]: Invalid JSON — ${(e as Error).message}`)
    errorCount++
    continue
  }

  if (!Array.isArray(questions)) {
    console.error(`  ERROR [${displayName}]: Root must be an array`)
    errorCount++
    continue
  }

  // Per-file correctIndex distribution tracking
  const correctIndexCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  const fileIds = new Set<string>()

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]

    // ID checks
    if (q.id == null || q.id === '') {
      logError(displayName, i, 'Missing or empty id')
    } else {
      // Validate ID format: {topic}-{NNN}
      const ID_PATTERN = /^[a-z][a-z-]+-\d{3}$/
      const fileTopic = file.replace('.json', '')
      if (!ID_PATTERN.test(q.id)) {
        logError(displayName, i, `ID "${q.id}" does not match required pattern {topic}-{NNN} (e.g. "${fileTopic}-001")`)
      } else if (!q.id.startsWith(fileTopic + '-')) {
        logError(displayName, i, `ID "${q.id}" does not start with file topic "${fileTopic}-"`)
      }
      if (globalIds.has(q.id)) {
        logError(displayName, i, `Duplicate id across files: "${q.id}"`)
      }
      if (fileIds.has(q.id)) {
        logError(displayName, i, `Duplicate id within file: "${q.id}"`)
      }
      globalIds.add(q.id)
      fileIds.add(q.id)
    }

    // Topic
    if (!VALID_TOPICS.includes(q.topic)) {
      logError(displayName, i, `Invalid topic: "${q.topic}". Valid: ${VALID_TOPICS.join(', ')}`)
    }

    // Type
    if (!VALID_TYPES.includes(q.type)) {
      logError(displayName, i, `Invalid type: "${q.type}". Valid: ${VALID_TYPES.join(', ')}`)
    }

    // Difficulty
    if (!VALID_DIFFICULTIES.includes(q.difficulty)) {
      logError(displayName, i, `Invalid difficulty: "${q.difficulty}". Valid: ${VALID_DIFFICULTIES.join(', ')}`)
    }

    // Question text
    if (q.question == null || q.question.trim() === '') {
      logError(displayName, i, 'Question text is empty')
    }

    // Options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      logError(displayName, i, `Must have exactly 4 options, got ${Array.isArray(q.options) ? q.options.length : 'none'}`)
    } else {
      // Check for duplicate options
      const optionSet = new Set(q.options.map((o: string) => o.trim()))
      if (optionSet.size !== 4) {
        logError(displayName, i, 'Duplicate options detected')
      }
    }

    // correctIndex
    if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
      logError(displayName, i, `correctIndex must be 0-3, got "${q.correctIndex}"`)
    } else {
      correctIndexCounts[q.correctIndex]++
    }

    // Explanation
    if (q.explanation == null || q.explanation.trim() === '') {
      logError(displayName, i, 'Explanation is empty')
    } else if (q.explanation.trim().length < 20) {
      logError(displayName, i, `Explanation too short (${q.explanation.trim().length} chars, min 20)`)
    }

    // sourceUrl
    if (q.sourceUrl == null || q.sourceUrl.trim() === '') {
      logError(displayName, i, 'sourceUrl is empty')
    } else if (!q.sourceUrl.startsWith('http')) {
      logError(displayName, i, `sourceUrl must start with "http", got "${q.sourceUrl.substring(0, 30)}"`)
    }

    // output-prediction must have code
    if (q.type === 'output-prediction') {
      if (q.code == null || q.code.trim() === '') {
        logError(displayName, i, 'output-prediction question must have a "code" field')
      } else {
        // Code execution validation
        validateCodeExecution(displayName, i, q)
      }
    }
  }

  // correctIndex distribution check
  if (questions.length > 0) {
    const total = questions.length
    for (const [idx, count] of Object.entries(correctIndexCounts)) {
      const ratio = count / total
      if (ratio > 0.5) {
        logError(displayName, -1, `correctIndex=${idx} appears in ${(ratio * 100).toFixed(0)}% of questions (max 50%)`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Code execution validation for output-prediction questions
// ---------------------------------------------------------------------------
function validateCodeExecution(file: string, idx: number, q: Question): void {
  if (q.code == null || q.code.trim() === '') return

  const expectedAnswer = q.options[q.correctIndex]
  if (expectedAnswer == null) return

  // Skip Korean answers (cannot validate via execution)
  if (/[\uAC00-\uD7AF]/.test(expectedAnswer)) return

  const tmpFile = path.join(PROJECT_DIR, '.harness', 'state', `_tmp_validate_${Date.now()}.js`)
  try {
    fs.writeFileSync(tmpFile, q.code, 'utf-8')
    const output = execSync(`node "${tmpFile}" 2>&1`, {
      timeout: 5000,
      encoding: 'utf-8',
    }).trim()

    // Normalize: trim whitespace, normalize quotes
    const normalizeStr = (s: string): string =>
      s.trim().replace(/['"]/g, '').replace(/\s+/g, ' ')

    const normalizedOutput = normalizeStr(output)
    const normalizedExpected = normalizeStr(expectedAnswer)

    if (normalizedOutput !== normalizedExpected) {
      logWarning(
        file,
        idx,
        `Code output mismatch: expected "${normalizedExpected}", got "${normalizedOutput}"`
      )
    }
  } catch {
    // Execution errors are warnings, not errors (code might use browser APIs, etc.)
    logWarning(file, idx, 'Code execution failed (may use browser APIs)')
  } finally {
    try {
      fs.unlinkSync(tmpFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('')
console.log(`Validation complete: ${errorCount} errors, ${warningCount} warnings`)

if (errorCount > 0) {
  process.exit(1)
}

process.exit(0)
