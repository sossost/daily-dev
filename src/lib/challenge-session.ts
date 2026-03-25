/**
 * Challenge session generator — builds a large pool of random questions
 * for timed challenge mode. Unlike SRS sessions, challenge mode is purely
 * for speed practice and does not affect spaced repetition scheduling.
 */
import type { Question, SessionQuestion, Topic } from '@/types'
import { getAllQuestions } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'
import { shuffle } from '@/lib/shuffle'

/** Maximum questions in a challenge pool (more than enough for any time limit). */
const CHALLENGE_POOL_SIZE = 50

export type ChallengeDuration = 30 | 60 | 90

export const CHALLENGE_DURATIONS: readonly ChallengeDuration[] = [30, 60, 90] as const

/** i18n keys for each duration — use with useTranslations('challenge') */
export const CHALLENGE_DURATION_KEYS: Record<ChallengeDuration, string> = {
  30: 'duration30',
  60: 'duration60',
  90: 'duration90',
}

export interface ChallengeResult {
  readonly totalAnswered: number
  readonly correctCount: number
  readonly accuracy: number
  readonly duration: ChallengeDuration
  readonly questionsPerMinute: number
}

const SECONDS_PER_MINUTE = 60
const PERCENTAGE_MULTIPLIER = 100

/**
 * Generate a large pool of shuffled questions for challenge mode.
 * Returns up to CHALLENGE_POOL_SIZE questions with shuffled options.
 */
export function generateChallengeSession(
  topicFilter?: readonly Topic[],
): SessionQuestion[] {
  const allQuestions = getAllQuestions()
  const filterSet = topicFilter != null ? new Set(topicFilter) : null
  const filtered = filterSet != null
    ? allQuestions.filter((q) => filterSet.has(q.topic))
    : allQuestions
  const shuffled = shuffle(filtered)
  const selected = shuffled.slice(0, CHALLENGE_POOL_SIZE)

  return selected.map((question) => ({
    question: shuffleOptions(question),
    isReview: false,
  }))
}

/**
 * Compute challenge result statistics from answers.
 */
export function computeChallengeResult(
  answers: readonly { readonly isCorrect: boolean }[],
  duration: ChallengeDuration,
): ChallengeResult {
  const totalAnswered = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const accuracy = totalAnswered > 0
    ? Math.round((correctCount / totalAnswered) * PERCENTAGE_MULTIPLIER)
    : 0
  const questionsPerMinute = totalAnswered > 0
    ? Math.round((totalAnswered / duration) * SECONDS_PER_MINUTE * PERCENTAGE_MULTIPLIER) / PERCENTAGE_MULTIPLIER
    : 0

  return {
    totalAnswered,
    correctCount,
    accuracy,
    duration,
    questionsPerMinute,
  }
}
