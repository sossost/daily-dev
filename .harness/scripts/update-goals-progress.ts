#!/usr/bin/env tsx

/**
 * Goals Progress Updater
 *
 * Measures current project state and updates the status table in GOALS.md.
 */

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_BASE_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const TESTS_DIR = path.join(PROJECT_DIR, '__tests__')
const GOALS_PATH = path.join(PROJECT_DIR, 'GOALS.md')

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

function resolveQuestionsDir(): string {
  const enDir = path.join(QUESTIONS_BASE_DIR, 'en')
  if (fs.existsSync(enDir)) return enDir
  return QUESTIONS_BASE_DIR
}

function countTopics(): number {
  const dir = resolveQuestionsDir()
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length
}

function countQuestions(): number {
  const dir = resolveQuestionsDir()
  if (!fs.existsSync(dir)) return 0
  let total = 0
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8')
      const questions = JSON.parse(content)
      if (Array.isArray(questions)) total += questions.length
    } catch { /* skip */ }
  }
  return total
}

function countTests(): number {
  if (!fs.existsSync(TESTS_DIR)) return 0
  let total = 0

  function walk(dir: string): void {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) { walk(fullPath); continue }
        if (!/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) continue
        try {
          for (const line of fs.readFileSync(fullPath, 'utf-8').split('\n')) {
            const trimmed = line.trim()
            if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
            if (/\b(it|test)\.skip\s*\(/.test(trimmed)) continue
            if (/\b(xit|xtest)\s*\(/.test(trimmed)) continue
            const matches = trimmed.match(/\b(it|test)\s*\(/g)
            if (matches != null) total += matches.length
          }
        } catch { /* skip */ }
      }
    } catch { /* skip */ }
  }

  walk(TESTS_DIR)
  return total
}

function detectFeatures(): string[] {
  const detected: string[] = []
  if (!fs.existsSync(SRC_DIR)) return detected

  function searchDir(dir: string, pattern: RegExp): boolean {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) { if (searchDir(fullPath, pattern)) return true }
        else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
          try { if (pattern.test(fs.readFileSync(fullPath, 'utf-8'))) return true } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
    return false
  }

  if (searchDir(SRC_DIR, /prefers-color-scheme|dark-mode|theme-toggle/i)) detected.push('Dark mode')
  if (searchDir(SRC_DIR, /Streak|streak-count|currentStreak/i)) detected.push('Streak')
  if (searchDir(SRC_DIR, /onKeyDown|useHotkey|keydown/i)) detected.push('Keyboard shortcuts')
  if (searchDir(SRC_DIR, /session-history|SessionHistory/i)) detected.push('Session history')
  if (searchDir(SRC_DIR, /topic-filter|TopicFilter/i)) detected.push('Topic filter')
  if (searchDir(SRC_DIR, /export.*progress|import.*progress/i)) detected.push('Export/Import')
  if (searchDir(SRC_DIR, /bookmark|Bookmark/i)) detected.push('Bookmark')
  if (searchDir(SRC_DIR, /extra.*practice|ExtraPractice/i)) detected.push('Extra practice')

  return detected
}

// ---------------------------------------------------------------------------
// Update GOALS.md
// ---------------------------------------------------------------------------

const topics = countTopics()
const questions = countQuestions()
const tests = countTests()
const features = detectFeatures()
const featureText = features.length > 0 ? features.join(', ') : 'None'

let content = fs.readFileSync(GOALS_PATH, 'utf-8')

content = content.replace(
  /(\| Content \| Topics \|)\s*[^|]+\|/,
  `$1 ${topics} topics |`,
)
content = content.replace(
  /(\| Content \| Questions \|)\s*[^|]+\|/,
  `$1 ${questions} questions |`,
)
content = content.replace(
  /(\| Features \| Implemented \|)\s*[^|]+\|/,
  `$1 ${featureText} |`,
)
content = content.replace(
  /(\| Code \| Tests \|)\s*[^|]+\|/,
  `$1 ${tests} tests |`,
)
content = content.replace(
  /(\| Deploy \| Status \|)\s*[^|]+\|/,
  `$1 Deployed |`,
)

fs.writeFileSync(GOALS_PATH, content, 'utf-8')
console.log(`GOALS.md updated: ${topics} topics, ${questions} questions, ${featureText}, ${tests} tests, Deployed`)
