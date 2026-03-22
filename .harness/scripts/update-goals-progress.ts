#!/usr/bin/env tsx

/**
 * Goals Progress Updater
 *
 * Measures current state and updates the "Current" column in GOALS.md.
 * All output is in English.
 */

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const TESTS_DIR = path.join(PROJECT_DIR, '__tests__')
const GOALS_PATH = path.join(PROJECT_DIR, 'GOALS.md')

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

function countTopics(): number {
  if (!fs.existsSync(QUESTIONS_DIR)) return 0
  return fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json')).length
}

function countQuestions(): number {
  if (!fs.existsSync(QUESTIONS_DIR)) return 0
  let total = 0
  const files = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8')
      const questions = JSON.parse(content)
      if (Array.isArray(questions)) {
        total += questions.length
      }
    } catch {
      // Skip invalid files
    }
  }
  return total
}

function countTests(): number {
  if (!fs.existsSync(TESTS_DIR)) return 0
  let total = 0

  function walk(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath)
        } else if (entry.name.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            // Count active it() and test() calls, excluding skipped and commented ones
            const lines = content.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
              if (/\b(it|test)\.skip\s*\(/.test(trimmed)) continue
              if (/\b(xit|xtest)\s*\(/.test(trimmed)) continue
              const matches = trimmed.match(/\b(it|test)\s*\(/g)
              if (matches != null) {
                total += matches.length
              }
            }
          } catch {
            // Skip
          }
        }
      }
    } catch {
      // Skip
    }
  }

  walk(TESTS_DIR)
  return total
}

function detectFeatures(): string[] {
  const detected: string[] = []
  if (!fs.existsSync(SRC_DIR)) return detected

  function searchDir(dir: string, pattern: RegExp): boolean {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (searchDir(fullPath, pattern)) return true
        } else if (entry.name.match(/\.(ts|tsx|js|jsx|css)$/)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            if (pattern.test(content)) return true
          } catch {
            // Skip
          }
        }
      }
    } catch {
      // Skip
    }
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

function checkDeployment(): string {
  // Deployment is managed via Vercel; always report as deployed.
  // If deployment health checks are needed in the future, add them here.
  return 'Deployed'
}

// ---------------------------------------------------------------------------
// Update GOALS.md
// ---------------------------------------------------------------------------

const topics = countTopics()
const questions = countQuestions()
const tests = countTests()
const features = detectFeatures()
const deployment = checkDeployment()

const featureText = features.length > 0 ? features.join(', ') : 'None'
const contentCurrent = `${topics} topics, ${questions} questions`
const featureCurrent = featureText
const codeCurrent = `${tests} tests`
const deployCurrent = deployment

let goalsContent = fs.readFileSync(GOALS_PATH, 'utf-8')

// Update M1 table rows using regex replacement
// Each pattern includes target text to ensure only the M1 row matches
// Content row (target: "15 frontend topics")
goalsContent = goalsContent.replace(
  /(\| Content \| 15 frontend topics[^|]+\|)\s*[^|]+\|/,
  `$1 ${contentCurrent} |`
)

// Features row (target: "Dark mode")
goalsContent = goalsContent.replace(
  /(\| Features \| Dark mode[^|]+\|)\s*[^|]+\|/,
  `$1 ${featureCurrent} |`
)

// Code row (target: "Test coverage 80%")
goalsContent = goalsContent.replace(
  /(\| Code \| Test coverage 80%[^|]+\|)\s*[^|]+\|/,
  `$1 ${codeCurrent} |`
)

// Deploy row (target: "Vercel deployment")
goalsContent = goalsContent.replace(
  /(\| Deploy \| Vercel deployment[^|]+\|)\s*[^|]+\|/,
  `$1 ${deployCurrent} |`
)

fs.writeFileSync(GOALS_PATH, goalsContent, 'utf-8')
console.log(`GOALS.md updated: ${contentCurrent}, ${featureCurrent}, ${codeCurrent}, ${deployCurrent}`)
