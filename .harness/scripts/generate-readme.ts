#!/usr/bin/env tsx

/**
 * README Generator
 *
 * Generates README.md with dynamic content from the current project state.
 * All output is in English.
 */

import * as fs from 'fs'
import * as path from 'path'

const PROJECT_DIR = path.resolve(__dirname, '../..')
const QUESTIONS_BASE_DIR = path.join(PROJECT_DIR, 'data/questions')
const SRC_DIR = path.join(PROJECT_DIR, 'src')
const README_PATH = path.join(PROJECT_DIR, 'README.md')

// ---------------------------------------------------------------------------
// English topic labels (NOT from TOPIC_LABELS which is Korean)
// ---------------------------------------------------------------------------
const ENGLISH_LABELS: Record<string, string> = {
  scope: 'Scope',
  closure: 'Closure',
  prototype: 'Prototype',
  this: 'this Keyword',
  'event-loop': 'Event Loop',
  async: 'Async',
  'type-coercion': 'Type Coercion',
  'react-basics': 'React Basics',
  'browser-api': 'Browser API',
  'css-layout': 'CSS Layout',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  database: 'Database',
  'api-design': 'API Design',
  'data-structures': 'Data Structures',
  network: 'Network',
  'design-patterns': 'Design Patterns',
  'dom-manipulation': 'DOM Manipulation',
  promise: 'Promise',
  'web-performance': 'Web Performance',
  'web-security': 'Web Security',
  algorithms: 'Algorithms',
  'git-advanced': 'Git Advanced',
  docker: 'Docker',
  cicd: 'CI/CD',
}

// ---------------------------------------------------------------------------
// Count questions per topic
// ---------------------------------------------------------------------------
function resolveQuestionsDir(): string {
  const enDir = path.join(QUESTIONS_BASE_DIR, 'en')
  if (fs.existsSync(enDir)) return enDir
  return QUESTIONS_BASE_DIR
}

function getTopicCounts(): Record<string, number> {
  const questionsDir = resolveQuestionsDir()
  const counts: Record<string, number> = {}
  if (!fs.existsSync(questionsDir)) return counts

  const files = fs.readdirSync(questionsDir).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    const topic = file.replace('.json', '')
    try {
      const content = fs.readFileSync(path.join(questionsDir, file), 'utf-8')
      const questions = JSON.parse(content)
      if (Array.isArray(questions)) {
        counts[topic] = questions.length
      }
    } catch {
      counts[topic] = 0
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
// Detect features
// ---------------------------------------------------------------------------
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

  const featureChecks: Array<[RegExp, string]> = [
    [/next-intl|useTranslations|useLocale/i, 'Multi-language support (English / Korean)'],
    [/prefers-color-scheme|dark-mode|theme-toggle/i, 'Dark mode with system preference detection'],
    [/challenge.*mode|ChallengeMode|timed.*challenge/i, 'Timed challenge mode'],
    [/wrong.*answer.*notebook|WrongAnswer/i, 'Wrong answer notebook for targeted review'],
    [/Streak|streak-count|currentStreak/i, 'Streak tracking for daily sessions'],
    [/onKeyDown|useHotkey|keydown/i, 'Keyboard shortcuts for navigation'],
    [/session-history|SessionHistory/i, 'Session history with past results'],
    [/topic-filter|TopicFilter/i, 'Topic filter for focused practice'],
    [/export.*progress|import.*progress/i, 'Export/Import progress data'],
    [/bookmark|Bookmark/i, 'Bookmark questions for review'],
    [/onboarding|OnboardingModal/i, 'Onboarding flow with position-based topics'],
  ]

  for (const [pattern, label] of featureChecks) {
    if (searchDir(SRC_DIR, pattern)) {
      detected.push(label)
    }
  }

  return detected
}

// ---------------------------------------------------------------------------
// Generate README
// ---------------------------------------------------------------------------
const topicCounts = getTopicCounts()
const features = detectFeatures()
const totalQuestions = Object.values(topicCounts).reduce((a, b) => a + b, 0)
const topicCount = Object.keys(topicCounts).length

// Build topics table from actual question files, falling back to first 7 defaults if none exist
let topicsTable = '| Topic | Questions |\n|-------|-----------|'
const hasQuestionFiles = Object.keys(topicCounts).length > 0

if (hasQuestionFiles) {
  for (const [topic, count] of Object.entries(topicCounts)) {
    const label = ENGLISH_LABELS[topic] ?? topic.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    topicsTable += `\n| ${label} | ${count} |`
  }
} else {
  for (const label of Object.values(ENGLISH_LABELS).slice(0, 7)) {
    topicsTable += `\n| ${label} | 0 |`
  }
}

// Build features list
let featuresSection = `- 10-question daily sessions with spaced repetition
- Multiple question types: concept, output prediction, debugging, comparison
- Progress tracking with topic-level statistics
- Mobile-responsive design`

if (features.length > 0) {
  for (const feature of features) {
    featuresSection += `\n- ${feature}`
  }
}

const readme = `# DailyDev

A daily learning platform where every developer levels up in just 5 minutes a day.

**[Live Demo](https://daily-dev-omega.vercel.app)**

## Features

${featuresSection}

## Topics

${topicsTable}

**Total: ${totalQuestions} questions across ${topicCount > 0 ? topicCount : 7} topics**

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Build for production
npm run build
\`\`\`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS 4, Framer Motion 12
- **i18n**: next-intl (English / Korean)
- **State**: Zustand 5
- **Language**: TypeScript 5 (strict mode)
- **Testing**: Jest 29, React Testing Library
- **Utilities**: Zod, clsx, date-fns, lucide-react, sonner, Prism.js

## AI Harness System

DailyDev uses an autonomous AI agent system to continuously improve content and code quality. Agents run on a schedule, generate questions, fix bugs, add features, and review each other's work.

See \`.harness/agents/\` for agent role definitions.

## Project Structure

\`\`\`
src/
  app/[locale]/  — Locale-aware pages and layouts
  components/    — React components
  hooks/         — Custom React hooks
  i18n/          — next-intl routing, request config, navigation
  lib/           — Utilities, helpers, stores
  types/         — TypeScript type definitions
data/
  questions/
    en/          — English question JSON files (one per topic)
    ko/          — Korean question JSON files (one per topic)
messages/
  en.json        — English UI translations
  ko.json        — Korean UI translations
__tests__/       — Jest test files
.harness/        — Agent orchestration system
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

MIT
`

fs.writeFileSync(README_PATH, readme, 'utf-8')
console.log(`README.md updated (${totalQuestions} questions, ${topicCount} topics, ${features.length} features)`)
