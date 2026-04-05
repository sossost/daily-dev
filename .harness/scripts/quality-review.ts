#!/usr/bin/env tsx

/**
 * Quality Review — Semantic question quality management
 *
 * Commands:
 *   sample [--count N]   Sample N unverified questions from 50+ topics (default 5)
 *   sample-pending        Get questions in pendingFix state for re-review
 *   apply                 Process review results from stdin, update state
 *   stats                 Show verification statistics
 */

import * as fs from 'fs'
import * as path from 'path'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions/ko')
const EN_QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions/en')
const STATE_DIR = path.join(PROJECT_DIR, '.harness/state')
const STATE_FILE = path.join(STATE_DIR, 'quality-reviews.json')

const DEFAULT_SAMPLE_COUNT = 5
const PASS_THRESHOLD = 2
const TOPIC_THRESHOLD = 50

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface QuestionState {
  passCount: number
  verified: boolean
  pendingFix?: boolean
  lastFailReason?: string
  lastFailDimensions?: string[]
  lastReviewedAt?: string
}

interface RemovedRecord {
  reason: string
  failedDimensions: string[]
  removedAt: string
}

interface QualityState {
  questions: Record<string, QuestionState>
  removed: Record<string, RemovedRecord>
}

interface ReviewResult {
  id: string
  verdict: 'PASS' | 'FAIL'
  failedDimensions?: string[]
  reason?: string
}

interface ApplyOutput {
  passed: string[]
  needsFix: Array<{ id: string; reason: string; failedDimensions: string[] }>
  removed: Array<{ id: string; reason: string }>
}

// ---------------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------------

function loadState(): QualityState {
  if (!fs.existsSync(STATE_FILE)) {
    return { questions: {}, removed: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    return { questions: {}, removed: {} }
  }
}

function saveState(state: QualityState): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true })
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8')
}

// ---------------------------------------------------------------------------
// Question Loading
// ---------------------------------------------------------------------------

function loadQuestions(): Map<string, Question[]> {
  const topicMap = new Map<string, Question[]>()

  if (!fs.existsSync(QUESTIONS_DIR)) return topicMap

  for (const file of fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'))) {
    const topic = file.replace('.json', '')
    try {
      const questions: Question[] = JSON.parse(
        fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8'),
      )
      topicMap.set(topic, questions)
    } catch {
      // Skip unparseable files — structural validation catches these
    }
  }

  return topicMap
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function sample(count: number): void {
  const topicMap = loadQuestions()
  const state = loadState()

  const eligibleTopics = [...topicMap.entries()].filter(
    ([, questions]) => questions.length >= TOPIC_THRESHOLD,
  )

  if (eligibleTopics.length === 0) {
    console.log(JSON.stringify({ questions: [], message: 'No topics with 50+ questions' }))
    return
  }

  const candidates: Question[] = []

  for (const [, questions] of eligibleTopics) {
    for (const q of questions) {
      const qState = state.questions[q.id]
      if (qState?.verified === true) continue
      if (qState?.pendingFix === true) continue
      candidates.push(q)
    }
  }

  if (candidates.length === 0) {
    console.log(JSON.stringify({ questions: [], message: 'All eligible questions verified' }))
    return
  }

  // Prioritize: never reviewed (-1) > passCount 0 > passCount 1
  candidates.sort((a, b) => {
    const aCount = state.questions[a.id]?.passCount ?? -1
    const bCount = state.questions[b.id]?.passCount ?? -1
    return aCount - bCount
  })

  const sampled = candidates.slice(0, count)
  console.log(JSON.stringify({ questions: sampled }, null, 2))
}

function samplePending(): void {
  const topicMap = loadQuestions()
  const state = loadState()

  const pending: Question[] = []

  for (const [, questions] of topicMap) {
    for (const q of questions) {
      if (state.questions[q.id]?.pendingFix === true) {
        pending.push(q)
      }
    }
  }

  if (pending.length === 0) {
    console.log(JSON.stringify({ questions: [], message: 'No questions pending fix' }))
    return
  }

  console.log(JSON.stringify({ questions: pending }, null, 2))
}

function apply(): void {
  const input = fs.readFileSync('/dev/stdin', 'utf-8').trim()

  if (input === '') {
    console.error('No review results provided on stdin')
    process.exit(1)
  }

  const results = parseResults(input)

  if (results.length === 0) {
    console.error('No valid review results found in input')
    process.exit(1)
  }

  const state = loadState()
  const topicMap = loadQuestions()
  const now = new Date().toISOString()

  const output: ApplyOutput = { passed: [], needsFix: [], removed: [] }

  for (const result of results) {
    if (result.verdict === 'PASS') {
      const current = state.questions[result.id] ?? { passCount: 0, verified: false }
      current.passCount++
      current.verified = current.passCount >= PASS_THRESHOLD
      delete current.pendingFix
      delete current.lastFailReason
      delete current.lastFailDimensions
      current.lastReviewedAt = now
      state.questions[result.id] = current

      output.passed.push(result.id)
    } else {
      const current = state.questions[result.id]
      const reason = result.reason ?? 'Unknown reason'
      const dims = result.failedDimensions ?? []

      if (current?.pendingFix === true) {
        // Second failure after fix attempt — remove question
        removeQuestion(result.id, topicMap)
        state.removed[result.id] = {
          reason,
          failedDimensions: dims,
          removedAt: now,
        }
        delete state.questions[result.id]
        output.removed.push({ id: result.id, reason })
      } else {
        // First failure — mark for fix
        state.questions[result.id] = {
          passCount: current?.passCount ?? 0,
          verified: false,
          pendingFix: true,
          lastFailReason: reason,
          lastFailDimensions: dims,
          lastReviewedAt: now,
        }
        output.needsFix.push({ id: result.id, reason, failedDimensions: dims })
      }
    }
  }

  saveState(state)
  console.log(JSON.stringify(output, null, 2))
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseResults(text: string): ReviewResult[] {
  // Try JSON first
  const jsonStr = extractJSON(text)
  if (jsonStr != null) {
    try {
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) return parsed as ReviewResult[]
    } catch {
      // Fall through to text parsing
    }
  }

  // Fallback: text format  "ID: PASS" or "ID: FAIL [dims] — reason"
  return parseTextFormat(text)
}

function extractJSON(text: string): string | null {
  const match = text.match(/\[[\s\S]*\]/)
  return match?.[0] ?? null
}

function parseTextFormat(text: string): ReviewResult[] {
  const results: ReviewResult[] = []

  for (const line of text.split('\n')) {
    const trimmed = line.trim()

    const passMatch = trimmed.match(/^([a-z][a-z0-9-]+-\d{3}):\s*PASS$/i)
    if (passMatch != null) {
      results.push({ id: passMatch[1], verdict: 'PASS' })
      continue
    }

    const failMatch = trimmed.match(
      /^([a-z][a-z0-9-]+-\d{3}):\s*FAIL\s*\[([^\]]+)]\s*[—–-]\s*(.+)$/i,
    )
    if (failMatch != null) {
      results.push({
        id: failMatch[1],
        verdict: 'FAIL',
        failedDimensions: failMatch[2].split(',').map(d => d.trim()),
        reason: failMatch[3].trim(),
      })
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Question Removal
// ---------------------------------------------------------------------------

function removeQuestion(id: string, topicMap: Map<string, Question[]>): void {
  const topicMatch = id.match(/^(.+)-\d{3}$/)
  if (topicMatch == null) return

  const topic = topicMatch[1]

  for (const dir of [QUESTIONS_DIR, EN_QUESTIONS_DIR]) {
    const filePath = path.join(dir, `${topic}.json`)
    if (!fs.existsSync(filePath)) continue

    try {
      const questions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const filtered = questions.filter(q => q.id !== id)

      if (filtered.length < questions.length) {
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2) + '\n', 'utf-8')
        const locale = dir === QUESTIONS_DIR ? 'ko' : 'en'
        console.error(`Removed ${id} from ${locale}/${topic}.json`)
      }
    } catch {
      console.error(`Warning: Could not process ${topic}.json in ${dir}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function stats(): void {
  const state = loadState()
  const topicMap = loadQuestions()

  let totalQuestions = 0
  let totalEligible = 0
  let verified = 0
  let pendingFix = 0
  let unreviewed = 0
  const removedCount = Object.keys(state.removed).length

  const topicStats: Array<{
    topic: string
    total: number
    verified: number
    pending: number
    unreviewed: number
  }> = []

  for (const [topic, questions] of topicMap) {
    totalQuestions += questions.length

    if (questions.length < TOPIC_THRESHOLD) continue

    totalEligible += questions.length
    let tVerified = 0
    let tPending = 0
    let tUnreviewed = 0

    for (const q of questions) {
      const qState = state.questions[q.id]
      if (qState?.verified === true) {
        tVerified++
        verified++
      } else if (qState?.pendingFix === true) {
        tPending++
        pendingFix++
      } else {
        tUnreviewed++
        unreviewed++
      }
    }

    topicStats.push({
      topic,
      total: questions.length,
      verified: tVerified,
      pending: tPending,
      unreviewed: tUnreviewed,
    })
  }

  console.log('=== Quality Review Stats ===')
  console.log(`Total questions: ${totalQuestions}`)
  console.log(`Eligible (50+ topics): ${totalEligible}`)
  console.log(`Verified (2+ passes): ${verified}`)
  console.log(`Pending fix: ${pendingFix}`)
  console.log(`Unreviewed: ${unreviewed}`)
  console.log(`Removed: ${removedCount}`)
  console.log('')

  if (topicStats.length > 0) {
    console.log('Per topic:')
    for (const ts of topicStats.sort((a, b) => a.topic.localeCompare(b.topic))) {
      const pct = ts.total > 0 ? Math.round((ts.verified / ts.total) * 100) : 0
      console.log(
        `  ${ts.topic}: ${ts.verified}/${ts.total} verified (${pct}%), ` +
          `${ts.pending} pending, ${ts.unreviewed} unreviewed`,
      )
    }
  } else {
    console.log('No topics with 50+ questions yet.')
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const command = process.argv[2]

switch (command) {
  case 'sample': {
    const countIdx = process.argv.indexOf('--count')
    const count =
      countIdx >= 0 ? parseInt(process.argv[countIdx + 1], 10) : DEFAULT_SAMPLE_COUNT
    sample(Number.isNaN(count) ? DEFAULT_SAMPLE_COUNT : count)
    break
  }
  case 'sample-pending':
    samplePending()
    break
  case 'apply':
    apply()
    break
  case 'stats':
    stats()
    break
  default:
    console.error('Usage: quality-review.ts <sample|sample-pending|apply|stats> [--count N]')
    process.exit(1)
}
