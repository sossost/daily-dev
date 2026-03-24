#!/usr/bin/env tsx

/**
 * Dynamic Context Generator
 *
 * Scans project state every harness run and produces .harness/docs/context.md.
 * Agents consume this file to make informed decisions without modifying
 * protected files.
 *
 * Output: .harness/docs/context.md
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const STATUS_FILE = path.join(PROJECT_DIR, '.harness/docs/status.md')
const OUTPUT_FILE = path.join(PROJECT_DIR, '.harness/docs/context.md')

// ---------------------------------------------------------------------------
// 1. Implemented Features — scan src/ for known patterns
// ---------------------------------------------------------------------------

interface FeatureCheck {
  id: string
  label: string
  pattern: RegExp
}

const FEATURE_CHECKS: FeatureCheck[] = [
  { id: 'dark-mode', label: 'Dark mode with system preference detection', pattern: /prefers-color-scheme|dark-mode|theme-toggle|ThemeToggle/i },
  { id: 'streak', label: 'Streak tracking for daily sessions', pattern: /currentStreak|longestStreak|streak/i },
  { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts for navigation', pattern: /onKeyDown|useHotkey|keydown|KeyboardEvent/i },
  { id: 'session-history', label: 'Session history with past results', pattern: /session-history|SessionHistory|SessionHistoryCard/i },
  { id: 'topic-filter', label: 'Topic filter for focused practice', pattern: /topic-filter|TopicFilter|topicFilter/i },
  { id: 'export-import', label: 'Export/Import progress data', pattern: /export.*progress|import.*progress|exportData|importData/i },
  { id: 'bookmark', label: 'Bookmark questions for review', pattern: /bookmark|Bookmark|useBookmarkStore/i },
  { id: 'extra-practice', label: 'Extra practice mode', pattern: /extra.*practice|ExtraPractice|practiceMode/i },
  { id: 'statistics', label: 'Statistics dashboard with trends', pattern: /StatsDashboard|statistics.*dashboard|accuracy.*trend/i },
  { id: 'progress-sharing', label: 'Shareable progress card', pattern: /ShareCard|progress.*share|shareProgress/i },
  { id: 'srs-visualization', label: 'Spaced repetition schedule visualization', pattern: /ReviewCalendar|srs.*visual|upcomingReview/i },
  { id: 'error-boundary', label: 'Error boundary with Sentry', pattern: /ErrorBoundary|captureError|initSentry/i },
  { id: 'ga-tracking', label: 'Google Analytics tracking', pattern: /gtag|GoogleAnalytics|GA_MEASUREMENT/i },
]

function detectFeatures(): FeatureCheck[] {
  const detected: FeatureCheck[] = []
  if (!fs.existsSync(SRC_DIR)) return detected

  function searchDir(dir: string, pattern: RegExp): boolean {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (searchDir(fullPath, pattern)) return true
        } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
          try {
            if (pattern.test(fs.readFileSync(fullPath, 'utf-8'))) return true
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
    return false
  }

  for (const check of FEATURE_CHECKS) {
    if (searchDir(SRC_DIR, check.pattern)) {
      detected.push(check)
    }
  }

  return detected
}

// ---------------------------------------------------------------------------
// 2. Topic & Question Counts
// ---------------------------------------------------------------------------

interface TopicInfo {
  name: string
  count: number
}

function getTopicInfo(): TopicInfo[] {
  if (!fs.existsSync(QUESTIONS_DIR)) return []
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((file) => {
      const name = file.replace('.json', '')
      try {
        const content = fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8')
        const questions = JSON.parse(content)
        return { name, count: Array.isArray(questions) ? questions.length : 0 }
      } catch {
        return { name, count: 0 }
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ---------------------------------------------------------------------------
// 3. Recent Run History — parse status.md
// ---------------------------------------------------------------------------

interface RunRecord {
  date: string
  agent: string
  result: string
  summary: string
}

function parseRecentRuns(): RunRecord[] {
  if (!fs.existsSync(STATUS_FILE)) return []
  const content = fs.readFileSync(STATUS_FILE, 'utf-8')

  const records: RunRecord[] = []
  const tableRegex = /\|\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*\|\s*(\w+)\s*\|\s*(\w[\w-]*)\s*\|\s*(.+?)\s*\|/g
  let match
  while ((match = tableRegex.exec(content)) !== null) {
    records.push({
      date: match[1].trim(),
      agent: match[2].trim(),
      result: match[3].trim(),
      summary: match[4].trim(),
    })
  }

  return records
}

function analyzeRunHistory(runs: RunRecord[]): {
  recentFailures: RunRecord[]
  ghostRuns: RunRecord[]
  agentSuccessRate: Record<string, { success: number; total: number }>
} {
  const recentFailures = runs.filter(
    (r) => r.result === 'rejected' || r.result === 'error' || r.result === 'failed',
  )
  const ghostRuns = runs.filter((r) => r.result === 'no-changes')

  const agentSuccessRate: Record<string, { success: number; total: number }> = {}
  for (const run of runs) {
    if (agentSuccessRate[run.agent] == null) {
      agentSuccessRate[run.agent] = { success: 0, total: 0 }
    }
    agentSuccessRate[run.agent].total++
    if (run.result === 'success') {
      agentSuccessRate[run.agent].success++
    }
  }

  return { recentFailures, ghostRuns, agentSuccessRate }
}

// ---------------------------------------------------------------------------
// 4. Test Summary
// ---------------------------------------------------------------------------

function getTestSummary(): string {
  try {
    const output = execSync('npx jest --ci --silent 2>&1 || true', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      timeout: 60_000,
    })
    const suiteMatch = output.match(/Test Suites:\s*(\d+)\s*passed,\s*(\d+)\s*total/)
    const testMatch = output.match(/Tests:\s*(\d+)\s*passed,\s*(\d+)\s*total/)
    if (suiteMatch != null && testMatch != null) {
      return `${testMatch[1]}/${testMatch[2]} tests passing (${suiteMatch[1]} suites)`
    }
    return 'unknown'
  } catch {
    return 'could not run tests'
  }
}

// ---------------------------------------------------------------------------
// 5. App Routes — scan src/app for pages
// ---------------------------------------------------------------------------

function getAppRoutes(): string[] {
  const appDir = path.join(SRC_DIR, 'app')
  if (!fs.existsSync(appDir)) return []

  const routes: string[] = []
  function walk(dir: string, prefix: string) {
    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), `${prefix}/${entry.name}`)
        } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          routes.push(prefix === '' ? '/' : prefix)
        }
      }
    } catch { /* skip */ }
  }
  walk(appDir, '')
  return routes.sort()
}

// ---------------------------------------------------------------------------
// Generate context.md
// ---------------------------------------------------------------------------

function generate(): string {
  const lines: string[] = []

  lines.push('# Dynamic Agent Context')
  lines.push('')
  lines.push('> Auto-generated by `generate-context.ts` every harness run. Do not edit manually.')
  lines.push(`> Generated at: ${new Date().toISOString()}`)
  lines.push('')

  // --- Implemented Features ---
  const features = detectFeatures()
  lines.push('## Implemented Features')
  lines.push('')
  if (features.length > 0) {
    lines.push('The following features ALREADY EXIST. Do NOT re-implement them:')
    lines.push('')
    for (const f of features) {
      lines.push(`- **${f.id}**: ${f.label}`)
    }
  } else {
    lines.push('No features detected yet.')
  }
  lines.push('')

  // --- App Routes ---
  const routes = getAppRoutes()
  lines.push('## App Routes')
  lines.push('')
  if (routes.length > 0) {
    for (const route of routes) {
      lines.push(`- \`${route}\``)
    }
  } else {
    lines.push('No routes detected.')
  }
  lines.push('')

  // --- Topics & Questions ---
  const topics = getTopicInfo()
  const totalQuestions = topics.reduce((sum, t) => sum + t.count, 0)
  lines.push('## Content Status')
  lines.push('')
  lines.push(`**${topics.length} topics, ${totalQuestions} questions total**`)
  lines.push('')
  lines.push('| Topic | Questions |')
  lines.push('|-------|-----------|')
  for (const t of topics) {
    lines.push(`| ${t.name} | ${t.count} |`)
  }
  lines.push('')

  // --- Test Summary ---
  const testSummary = getTestSummary()
  lines.push('## Test Status')
  lines.push('')
  lines.push(`${testSummary}`)
  lines.push('')

  // --- Run History & Directives ---
  const runs = parseRecentRuns()
  const { recentFailures, ghostRuns, agentSuccessRate } = analyzeRunHistory(runs)

  lines.push('## Run History Analysis')
  lines.push('')

  // Success rates
  lines.push('### Agent Success Rates')
  lines.push('')
  lines.push('| Agent | Success | Total | Rate |')
  lines.push('|-------|---------|-------|------|')
  for (const [agent, stats] of Object.entries(agentSuccessRate)) {
    const rate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0
    lines.push(`| ${agent} | ${stats.success} | ${stats.total} | ${rate}% |`)
  }
  lines.push('')

  // Avoid directives
  if (ghostRuns.length > 0 || recentFailures.length > 0) {
    lines.push('### Avoid Directives')
    lines.push('')
    lines.push('**Manager: consider these when selecting an agent.**')
    lines.push('')

    if (ghostRuns.length > 0) {
      lines.push('Recent ghost runs (no changes produced):')
      for (const run of ghostRuns) {
        lines.push(`- ${run.date}: **${run.agent}** — ${run.summary}`)
      }
      lines.push('')
    }

    if (recentFailures.length > 0) {
      lines.push('Recent failures:')
      for (const run of recentFailures) {
        lines.push(`- ${run.date}: **${run.agent}** — ${run.summary}`)
      }
      lines.push('')
    }

    lines.push('Avoid repeating the same agent+approach that recently failed or produced no changes.')
    lines.push('')
  }

  // --- Feature Agent Guidance ---
  lines.push('## Feature Agent Guidance')
  lines.push('')
  lines.push('Features NOT yet implemented (potential candidates):')
  lines.push('')
  const implementedIds = new Set(features.map((f) => f.id))
  const allFeatureIds = FEATURE_CHECKS.map((f) => f.id)
  const unimplemented = allFeatureIds.filter((id) => !implementedIds.has(id))
  if (unimplemented.length > 0) {
    for (const id of unimplemented) {
      const check = FEATURE_CHECKS.find((f) => f.id === id)
      if (check != null) {
        lines.push(`- **${id}**: ${check.label}`)
      }
    }
  } else {
    lines.push('All tracked feature ideas are implemented. Consider entirely new features.')
  }
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const context = generate()
  fs.writeFileSync(OUTPUT_FILE, context, 'utf-8')

  const features = detectFeatures()
  const topics = getTopicInfo()
  console.log(
    `context.md generated: ${features.length} features, ${topics.length} topics, ${parseRecentRuns().length} recent runs`,
  )
}

main()
