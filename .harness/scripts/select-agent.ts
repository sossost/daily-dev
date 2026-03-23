#!/usr/bin/env tsx

/**
 * Agent Selector — autonomous work prioritization.
 *
 * Analyzes current project state and selects the agent that would
 * provide the most value. No fixed targets — continuously improves.
 *
 * Priority logic:
 * 1. Weakest area gets attention first
 * 2. Agents that recently failed get deprioritized
 * 3. Variety is maintained to avoid tunnel vision
 */

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const TESTS_DIR = path.join(PROJECT_DIR, '__tests__')
const HISTORY_DIR = path.join(PROJECT_DIR, '.harness/state/history')
const RUN_COUNT_DIR = path.join(PROJECT_DIR, '.harness/state/run-counts')

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

interface TopicInfo {
  name: string
  count: number
}

function getTopics(): TopicInfo[] {
  if (!fs.existsSync(QUESTIONS_DIR)) return []
  return fs.readdirSync(QUESTIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const content = fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf-8')
        const questions = JSON.parse(content)
        return { name: f.replace('.json', ''), count: Array.isArray(questions) ? questions.length : 0 }
      } catch {
        return { name: f.replace('.json', ''), count: 0 }
      }
    })
}

function countTests(): number {
  if (!fs.existsSync(TESTS_DIR)) return 0
  let total = 0

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          for (const line of content.split('\n')) {
            const trimmed = line.trim()
            if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue
            if (/\b(it|test)\.skip\s*\(/.test(trimmed)) continue
            if (/\b(xit|xtest)\s*\(/.test(trimmed)) continue
            const matches = trimmed.match(/\b(it|test)\s*\(/g)
            if (matches != null) total += matches.length
          }
        } catch { /* skip */ }
      }
    }
  }

  walk(TESTS_DIR)
  return total
}

function countSourceFiles(): number {
  if (!fs.existsSync(SRC_DIR)) return 0
  let total = 0
  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name))
      else if (/\.(ts|tsx)$/.test(entry.name)) total++
    }
  }
  walk(SRC_DIR)
  return total
}

function detectFeatures(): string[] {
  const detected: string[] = []
  if (!fs.existsSync(SRC_DIR)) return detected

  function searchSrc(pattern: RegExp): boolean {
    function walk(dir: string): boolean {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) { if (walk(fullPath)) return true }
        else if (/\.(ts|tsx|js|jsx|css)$/.test(entry.name)) {
          try { if (pattern.test(fs.readFileSync(fullPath, 'utf-8'))) return true } catch { /* skip */ }
        }
      }
      return false
    }
    return walk(SRC_DIR)
  }

  if (searchSrc(/dark|theme-toggle|prefers-color-scheme/i)) detected.push('dark-mode')
  if (searchSrc(/currentStreak|streak/i)) detected.push('streak')
  if (searchSrc(/onKeyDown|useHotkey|keydown/i)) detected.push('keyboard-shortcuts')
  if (searchSrc(/session-history|SessionHistory/i)) detected.push('session-history')
  if (searchSrc(/topic-filter|TopicFilter|filterTopic/i)) detected.push('topic-filter')
  if (searchSrc(/export.*progress|import.*progress|exportData|importData/i)) detected.push('export-import')
  if (searchSrc(/bookmark|Bookmark/i)) detected.push('bookmark')
  if (searchSrc(/extra.*practice|practice.*mode/i)) detected.push('extra-practice')

  return detected
}

// ---------------------------------------------------------------------------
// History analysis
// ---------------------------------------------------------------------------

function getRecentHistory(agent: string, count: number): string[] {
  const historyFile = path.join(HISTORY_DIR, `history-${agent}.log`)
  if (!fs.existsSync(historyFile)) return []
  const lines = fs.readFileSync(historyFile, 'utf-8').trim().split('\n')
  return lines.slice(-count)
}

function getRecentFailRate(agent: string): number {
  const recent = getRecentHistory(agent, 5)
  if (recent.length === 0) return 0
  const failures = recent.filter((l) => /\] (rejected|error|no-changes):/.test(l)).length
  return failures / recent.length
}

function getTodayRunCount(agent: string): number {
  const today = new Date().toISOString().slice(0, 10)
  const countFile = path.join(RUN_COUNT_DIR, `${agent}-${today}.count`)
  if (!fs.existsSync(countFile)) return 0
  const raw = fs.readFileSync(countFile, 'utf-8').trim()
  return /^\d+$/.test(raw) ? parseInt(raw, 10) : 0
}

// ---------------------------------------------------------------------------
// Scoring — lower = more needed
// ---------------------------------------------------------------------------

interface AgentScore {
  agent: string
  need: number       // how much the project needs this (higher = more needed)
  failPenalty: number // recent failure rate (higher = deprioritize)
  runPenalty: number  // today's run count (higher = deprioritize for variety)
  finalScore: number  // need - penalties (highest wins)
  reason: string
}

function scoreAgents(): AgentScore[] {
  const topics = getTopics()
  const totalQuestions = topics.reduce((sum, t) => sum + t.count, 0)
  const minTopicCount = topics.length > 0 ? Math.min(...topics.map((t) => t.count)) : 0
  const tests = countTests()
  const sourceFiles = countSourceFiles()
  const features = detectFeatures()

  const scores: AgentScore[] = []

  // Content: need scales with how unbalanced/low question counts are
  const avgQuestions = topics.length > 0 ? totalQuestions / topics.length : 0
  const contentNeed = Math.max(0, 100 - avgQuestions * 2) + Math.max(0, 30 - minTopicCount)
  scores.push({
    agent: 'content',
    need: contentNeed,
    failPenalty: getRecentFailRate('content') * 50,
    runPenalty: getTodayRunCount('content') * 10,
    finalScore: 0,
    reason: `${topics.length} topics, ${totalQuestions} questions (min ${minTopicCount}/topic, avg ${avgQuestions.toFixed(0)}/topic)`,
  })

  // Code: need based on test-to-source ratio
  const testRatio = sourceFiles > 0 ? tests / sourceFiles : 0
  const codeNeed = Math.max(0, 100 - testRatio * 30)
  scores.push({
    agent: 'code',
    need: codeNeed,
    failPenalty: getRecentFailRate('code') * 50,
    runPenalty: getTodayRunCount('code') * 10,
    finalScore: 0,
    reason: `${tests} tests / ${sourceFiles} source files (ratio: ${testRatio.toFixed(1)})`,
  })

  // Expansion: need based on topic count
  const expansionNeed = Math.max(0, 100 - topics.length * 8)
  scores.push({
    agent: 'expansion',
    need: expansionNeed,
    failPenalty: getRecentFailRate('expansion') * 50,
    runPenalty: getTodayRunCount('expansion') * 10,
    finalScore: 0,
    reason: `${topics.length} topics`,
  })

  // Feature: always room for improvement
  const featureNeed = Math.max(0, 100 - features.length * 10)
  scores.push({
    agent: 'feature',
    need: featureNeed,
    failPenalty: getRecentFailRate('feature') * 50,
    runPenalty: getTodayRunCount('feature') * 10,
    finalScore: 0,
    reason: `${features.length} features: ${features.join(', ') || 'none'}`,
  })

  // Calculate final scores
  for (const s of scores) {
    s.finalScore = s.need - s.failPenalty - s.runPenalty
  }

  return scores.sort((a, b) => b.finalScore - a.finalScore)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const scores = scoreAgents()
const selected = scores[0]

console.error('Agent selection:')
for (const s of scores) {
  const marker = s.agent === selected.agent ? '→' : ' '
  console.error(`  ${marker} ${s.agent}: need=${s.need.toFixed(0)} fail=${s.failPenalty.toFixed(0)} runs=${s.runPenalty.toFixed(0)} final=${s.finalScore.toFixed(0)} (${s.reason})`)
}

console.log(selected.agent)
