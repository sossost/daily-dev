/**
 * Practice session generator — builds a quiz session filtered by topics and difficulty.
 * Unlike the standard SRS-driven session, practice mode lets users choose what to study.
 */
import type { Difficulty, Question, SessionQuestion, SRSRecord, Topic } from '@/types'
import { SESSION_TOTAL_QUESTIONS } from '@/types'
import { getAllQuestions } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'
import { shuffle } from '@/lib/shuffle'

export interface PracticeSessionOptions {
  readonly topics: readonly Topic[]
  readonly difficulty: Difficulty | 'all'
  readonly srsRecords: Record<string, SRSRecord>
}

/**
 * Filter questions by selected topics and difficulty.
 */
export function filterQuestions(options: PracticeSessionOptions): Question[] {
  const { topics, difficulty, srsRecords } = options
  const allQuestions = getAllQuestions()
  const topicSet = new Set(topics)

  const filtered = allQuestions.filter((q) => {
    if (!topicSet.has(q.topic)) return false
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false
    return true
  })

  const attemptedIds = new Set(Object.keys(srsRecords))

  const unattempted = filtered.filter((q) => !attemptedIds.has(q.id))
  const attempted = filtered.filter((q) => attemptedIds.has(q.id))

  return [...shuffle(unattempted), ...shuffle(attempted)]
}

/**
 * Generate a practice session from the given filter options.
 * Returns up to SESSION_TOTAL_QUESTIONS questions, prioritizing unattempted ones.
 */
export function generatePracticeSession(
  options: PracticeSessionOptions,
): SessionQuestion[] {
  const filtered = filterQuestions(options)
  const selected = filtered.slice(0, SESSION_TOTAL_QUESTIONS)

  return selected.map((question) => ({
    question: shuffleOptions(question),
    isReview: false,
  }))
}

/**
 * Count available questions matching the given filter options (ignoring SRS).
 */
export function countAvailableQuestions(
  topics: readonly Topic[],
  difficulty: Difficulty | 'all',
): number {
  const allQuestions = getAllQuestions()
  const topicSet = new Set(topics)

  return allQuestions.filter((q) => {
    if (!topicSet.has(q.topic)) return false
    if (difficulty !== 'all' && q.difficulty !== difficulty) return false
    return true
  }).length
}
