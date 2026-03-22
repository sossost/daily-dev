#!/usr/bin/env tsx

/**
 * Agent Selector
 *
 * Measures M1 progress and selects the agent that addresses
 * the area furthest from its target.
 *
 * Outputs agent name to stdout, reasoning to stderr.
 */

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const TESTS_DIR = path.join(PROJECT_DIR, '__tests__')

// ---------------------------------------------------------------------------
// M1 Targets
// ---------------------------------------------------------------------------
const TARGETS = {
  topics: 15,
  questions: 300,
  tests: 80,
  features: 8,
}

// ---------------------------------------------------------------------------
// Measurement Functions
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
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          // Count it() and test() calls, excluding skipped and commented ones
          const lines = content.split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            // Skip commented lines
            if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
            // Skip .skip and x-prefixed variants
            if (/\b(it|test)\.skip\s*\(/.test(trimmed)) continue
            if (/\b(xit|xtest)\s*\(/.test(trimmed)) continue
            // Count active it() and test() calls
            const matches = trimmed.match(/\b(it|test)\s*\(/g)
            if (matches != null) {
              total += matches.length
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  walk(TESTS_DIR)
  return total
}

function detectFeatures(): string[] {
  const detected: string[] = []

  function searchInSrc(pattern: RegExp, label: string): boolean {
    if (!fs.existsSync(SRC_DIR)) return false
    return walkAndSearch(SRC_DIR, pattern, label)
  }

  function walkAndSearch(dir: string, pattern: RegExp, label: string): boolean {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (walkAndSearch(fullPath, pattern, label)) return true
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

  // Dark mode
  if (searchInSrc(/dark|theme-toggle|color-scheme|prefers-color-scheme/i, 'dark-mode')) {
    detected.push('dark-mode')
  }

  // Streak
  if (searchInSrc(/Streak|streak-count|currentStreak/i, 'streak')) {
    detected.push('streak')
  }

  // Keyboard shortcuts
  if (searchInSrc(/onKeyDown|useHotkey|keydown|keyboard.*shortcut/i, 'keyboard-shortcuts')) {
    detected.push('keyboard-shortcuts')
  }

  // Session history
  if (searchInSrc(/session-history|SessionHistory|past.*session/i, 'session-history')) {
    detected.push('session-history')
  }

  // Topic filter
  if (searchInSrc(/topic-filter|TopicFilter|filterTopic/i, 'topic-filter')) {
    detected.push('topic-filter')
  }

  // Export/Import
  if (searchInSrc(/export.*progress|import.*progress|exportData|importData/i, 'export-import')) {
    detected.push('export-import')
  }

  // Bookmark
  if (searchInSrc(/bookmark|Bookmark|bookmarked/i, 'bookmark')) {
    detected.push('bookmark')
  }

  // Extra practice
  if (searchInSrc(/extra.*practice|practice.*mode|ExtraPractice/i, 'extra-practice')) {
    detected.push('extra-practice')
  }

  return detected
}

// ---------------------------------------------------------------------------
// Score Agents
// ---------------------------------------------------------------------------

const topics = countTopics()
const questions = countQuestions()
const tests = countTests()
const features = detectFeatures()

const contentProgress = Math.min(100, ((topics / TARGETS.topics) * 50 + (questions / TARGETS.questions) * 50))
const codeProgress = Math.min(100, (tests / TARGETS.tests) * 100)
const expansionProgress = Math.min(100, (topics / TARGETS.topics) * 100)
const featureProgress = Math.min(100, (features.length / TARGETS.features) * 100)

const scores: Record<string, number> = {
  content: contentProgress,
  code: codeProgress,
  expansion: expansionProgress,
  feature: featureProgress,
}

// Select agent with lowest progress
let selectedAgent = 'content'
let lowestScore = Infinity

for (const [agent, score] of Object.entries(scores)) {
  if (score < lowestScore) {
    lowestScore = score
    selectedAgent = agent
  }
}

// Output reasoning to stderr
console.error(`Agent selection reasoning:`)
console.error(`  Content:   ${contentProgress.toFixed(0)}% (${topics} topics, ${questions} questions)`)
console.error(`  Code:      ${codeProgress.toFixed(0)}% (${tests} tests)`)
console.error(`  Expansion: ${expansionProgress.toFixed(0)}% (${topics} topics)`)
console.error(`  Feature:   ${featureProgress.toFixed(0)}% (${features.length} features: ${features.join(', ') || 'none'})`)
console.error(`  Selected:  ${selectedAgent} (${lowestScore.toFixed(0)}% — most needed)`)

// Output agent name to stdout
console.log(selectedAgent)
