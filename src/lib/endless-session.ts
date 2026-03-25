/**
 * Endless session generator — builds an unlimited pool of shuffled questions
 * for marathon practice. Users answer until they decide to stop.
 * Does not affect SRS scheduling.
 */
import type { Difficulty, Question, SessionQuestion, Topic } from '@/types'
import type { Locale } from '@/i18n/routing'
import { getAllQuestions } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'
import { shuffle } from '@/lib/shuffle'

const PERCENTAGE_MULTIPLIER = 100

export interface EndlessSessionOptions {
  readonly topics: readonly Topic[]
  readonly difficulty: Difficulty | 'all'
  readonly locale?: Locale
}

export interface EndlessResult {
  readonly totalAnswered: number
  readonly correctCount: number
  readonly accuracy: number
  readonly topicBreakdown: readonly EndlessTopicStat[]
}

export interface EndlessTopicStat {
  readonly topic: Topic
  readonly correct: number
  readonly total: number
}

/**
 * Generate all available questions as SessionQuestion[], shuffled.
 * Returns the full pool — the page component streams through them.
 */
export function generateEndlessPool(
  options: EndlessSessionOptions,
): SessionQuestion[] {
  const { topics, difficulty, locale } = options
  const allQuestions = getAllQuestions(locale)
  const topicSet = new Set(topics)

  const filtered = allQuestions.filter((q) => {
    if (!topicSet.has(q.topic)) return false
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false
    return true
  })

  const shuffled = shuffle(filtered)

  return shuffled.map((question) => ({
    question: shuffleOptions(question),
    isReview: false,
  }))
}

/**
 * Compute endless session result from answers.
 */
export function computeEndlessResult(
  answers: readonly { readonly questionId: string; readonly topic: Topic; readonly isCorrect: boolean }[],
): EndlessResult {
  const totalAnswered = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const accuracy = totalAnswered > 0
    ? Math.round((correctCount / totalAnswered) * PERCENTAGE_MULTIPLIER)
    : 0

  const topicMap = new Map<Topic, { correct: number; total: number }>()
  for (const answer of answers) {
    const existing = topicMap.get(answer.topic)
    if (existing != null) {
      topicMap.set(answer.topic, {
        correct: existing.correct + (answer.isCorrect ? 1 : 0),
        total: existing.total + 1,
      })
    } else {
      topicMap.set(answer.topic, {
        correct: answer.isCorrect ? 1 : 0,
        total: 1,
      })
    }
  }

  const topicBreakdown: EndlessTopicStat[] = [...topicMap.entries()]
    .map(([topic, stats]) => ({ topic, ...stats }))
    .sort((a, b) => b.total - a.total)

  return { totalAnswered, correctCount, accuracy, topicBreakdown }
}
