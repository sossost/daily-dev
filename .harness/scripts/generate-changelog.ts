#!/usr/bin/env tsx

/**
 * Changelog generator — builds CHANGELOG.md from git commit history.
 * Groups commits by date, categorizes by conventional commit type.
 * Runs in the harness pipeline before commit.
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const OUTPUT_FILE = path.join(PROJECT_DIR, 'CHANGELOG.md')

interface Commit {
  hash: string
  date: string
  type: string
  scope: string | null
  subject: string
  body: string
}

const TYPE_LABELS: Record<string, string> = {
  feat: 'Features',
  fix: 'Bug Fixes',
  refactor: 'Refactoring',
  perf: 'Performance',
  docs: 'Documentation',
  test: 'Tests',
  chore: 'Chores',
  ci: 'CI/CD',
}

const TYPE_ORDER = ['feat', 'fix', 'refactor', 'perf', 'docs', 'test', 'chore', 'ci']

function getCommits(): Commit[] {
  const SEPARATOR = '---COMMIT---'
  const FIELD_SEP = '---FIELD---'

  const raw = execSync(
    `git log --format="${SEPARATOR}%h${FIELD_SEP}%ad${FIELD_SEP}%s${FIELD_SEP}%b" --date=short`,
    { cwd: PROJECT_DIR, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 },
  )

  return raw
    .split(SEPARATOR)
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => {
      const [hash, date, subject, ...bodyParts] = chunk.split(FIELD_SEP)
      const body = bodyParts.join('').trim()

      // Parse conventional commit: type(scope): subject
      const match = subject.match(/^(\w+)(?:\(([^)]*)\))?:\s*(.+)/)
      if (match == null) {
        return {
          hash: hash.trim(),
          date: date.trim(),
          type: 'other',
          scope: null,
          subject: subject.trim(),
          body,
        }
      }

      return {
        hash: hash.trim(),
        date: date.trim(),
        type: match[1],
        scope: match[2] ?? null,
        subject: match[3].trim(),
        body,
      }
    })
}

function groupByDate(commits: Commit[]): Map<string, Commit[]> {
  const groups = new Map<string, Commit[]>()
  for (const commit of commits) {
    const group = groups.get(commit.date) ?? []
    group.push(commit)
    groups.set(commit.date, group)
  }
  return groups
}

function groupByType(commits: Commit[]): Map<string, Commit[]> {
  const groups = new Map<string, Commit[]>()
  for (const commit of commits) {
    const type = TYPE_ORDER.includes(commit.type) ? commit.type : 'chore'
    const group = groups.get(type) ?? []
    group.push(commit)
    groups.set(type, group)
  }
  return groups
}

const MAX_SUBJECT_LENGTH = 80

function formatCommit(commit: Commit): string {
  const scope = commit.scope != null ? `**${commit.scope}**: ` : ''
  const subject = commit.subject.length > MAX_SUBJECT_LENGTH
    ? `${commit.subject.slice(0, MAX_SUBJECT_LENGTH)}...`
    : commit.subject
  return `- ${scope}${subject} (\`${commit.hash}\`)`
}

function generate(): string {
  const commits = getCommits()
  const byDate = groupByDate(commits)
  const lines: string[] = []

  lines.push('# Changelog')
  lines.push('')
  lines.push('> Auto-generated from git history. Do not edit manually.')
  lines.push('')

  for (const [date, dateCommits] of byDate) {
    lines.push(`## ${date}`)
    lines.push('')

    const byType = groupByType(dateCommits)

    for (const type of TYPE_ORDER) {
      const typeCommits = byType.get(type)
      if (typeCommits == null || typeCommits.length === 0) continue

      const label = TYPE_LABELS[type] ?? type
      lines.push(`### ${label}`)
      lines.push('')
      for (const commit of typeCommits) {
        lines.push(formatCommit(commit))
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function main() {
  const changelog = generate()
  fs.writeFileSync(OUTPUT_FILE, changelog, 'utf-8')

  const commits = getCommits()
  const dates = new Set(commits.map((c) => c.date))
  console.log(`Changelog generated: ${commits.length} commits, ${dates.size} days → ${OUTPUT_FILE}`)
}

main()
