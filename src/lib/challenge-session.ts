/**
 * Challenge session generator — builds a large pool of random questions
 * for timed challenge mode. Unlike SRS sessions, challenge mode is purely
 * for speed practice and does not affect spaced repetition scheduling.
 */
import type { Question, SessionQuestion } from '@/types'
import { getAllQuestions } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'
import { shuffle } from '@/lib/shuffle'

/** Maximum questions in a challenge pool (more than enough for any time limit). */
const CHALLENGE_POOL_SIZE = 50

export type ChallengeDuration = 30 | 60 | 90

export const CHALLENGE_DURATIONS: readonly ChallengeDuration[] = [30, 60, 90] as const

export const CHALLENGE_DURATION_LABELS: Record<ChallengeDuration, string> = {
  30: '30초',
  60: '1분',
  90: '1분 30초',
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
export function generateChallengeSession(): SessionQuestion[] {
  const allQuestions = getAllQuestions()
  const shuffled = shuffle(allQuestions)
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
