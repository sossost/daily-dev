import type { SRSRecord } from '@/types'
import { addDays } from '@/lib/date'

const MIN_EASINESS_FACTOR = 1.3

/**
 * SM-2 spaced repetition algorithm.
 * Calculates the next review state based on whether the answer was correct.
 */
export function calculateSRS(
  current: SRSRecord,
  isCorrect: boolean,
  today: string,
): SRSRecord {
  if (isCorrect) {
    const nextRepetitions = current.repetitions + 1
    let nextInterval: number

    if (nextRepetitions === 1) {
      nextInterval = 1
    } else if (nextRepetitions === 2) {
      nextInterval = 6
    } else {
      nextInterval = Math.round(current.interval * current.ease)
    }

    const CORRECT_EF_BONUS = 0.1
    const nextEase = Math.max(MIN_EASINESS_FACTOR, current.ease + CORRECT_EF_BONUS)

    return {
      questionId: current.questionId,
      ease: nextEase,
      interval: nextInterval,
      repetitions: nextRepetitions,
      nextReview: addDays(today, nextInterval),
      lastReview: today,
    }
  }

  // Incorrect: reset repetitions and interval, decrease ease
  const INCORRECT_EF_PENALTY = 0.2
  const nextEase = Math.max(MIN_EASINESS_FACTOR, current.ease - INCORRECT_EF_PENALTY)

  return {
    questionId: current.questionId,
    ease: nextEase,
    interval: 1,
    repetitions: 0,
    nextReview: addDays(today, 1),
    lastReview: today,
  }
}

/**
 * Create an initial SRS record for a question seen for the first time.
 */
export function createInitialSRS(questionId: string, today: string): SRSRecord {
  return {
    questionId,
    ease: 2.5,
    interval: 1,
    repetitions: 0,
    nextReview: addDays(today, 1),
    lastReview: today,
  }
}
