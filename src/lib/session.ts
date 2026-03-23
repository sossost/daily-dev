/**
 * Session generator — builds a quiz session using SRS (spaced repetition).
 * Each session = up to 5 review questions (due today) + new questions to fill 10 total.
 * Options are shuffled per question to prevent answer memorization.
 */
import type { Question, SessionQuestion, SRSRecord } from '@/types'
import { SESSION_TOTAL_QUESTIONS, SESSION_REVIEW_QUESTIONS } from '@/types'
import { getToday, isBeforeOrEqual } from '@/lib/date'
import { getAllQuestions } from '@/lib/questions'

/**
 * Fisher-Yates shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Shuffle the options of a question and remap the correctIndex.
 * Returns a new Question with shuffled options.
 */
export function shuffleOptions(question: Question): Question {
  const indices = [0, 1, 2, 3]
  const shuffledIndices = shuffle(indices)

  const shuffledOptions = shuffledIndices.map((i) => question.options[i]) as [
    string,
    string,
    string,
    string,
  ]

  const newCorrectIndex = shuffledIndices.indexOf(question.correctIndex)

  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  }
}

/**
 * Select questions due for review today, sorted by nextReview date (oldest first).
 */
export function selectReviewQuestions(
  srsRecords: Record<string, SRSRecord>,
  today: string,
): Question[] {
  const allQuestions = getAllQuestions()
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

  const dueRecords = Object.values(srsRecords)
    .filter((record) => isBeforeOrEqual(record.nextReview, today))
    .sort((a, b) => (a.nextReview < b.nextReview ? -1 : 1))

  const reviewQuestions: Question[] = []
  for (const record of dueRecords) {
    const question = questionsById.get(record.questionId)
    if (question != null) {
      reviewQuestions.push(question)
    }
  }

  return reviewQuestions
}

const DIFFICULTY_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

/**
 * Select new (unattempted) questions, ordered easy → medium → hard.
 * Within the same difficulty, questions are shuffled randomly.
 */
export function selectNewQuestions(
  srsRecords: Record<string, SRSRecord>,
): Question[] {
  const allQuestions = getAllQuestions()
  const attemptedIds = new Set(Object.keys(srsRecords))

  const unattempted = allQuestions.filter((q) => !attemptedIds.has(q.id))

  const byDifficulty = new Map<string, Question[]>()
  for (const q of unattempted) {
    const group = byDifficulty.get(q.difficulty) ?? []
    group.push(q)
    byDifficulty.set(q.difficulty, group)
  }

  return ['easy', 'medium', 'hard'].flatMap((d) => shuffle(byDifficulty.get(d) ?? []))
}

/**
 * Generate a session of questions: up to SESSION_REVIEW_QUESTIONS reviews,
 * filled with new questions to reach SESSION_TOTAL_QUESTIONS.
 */
export function generateSession(
  srsRecords: Record<string, SRSRecord>,
): SessionQuestion[] {
  const today = getToday()

  const reviewQuestions = selectReviewQuestions(srsRecords, today)
  const limitedReviews = reviewQuestions.slice(0, SESSION_REVIEW_QUESTIONS)

  const remainingCount = SESSION_TOTAL_QUESTIONS - limitedReviews.length
  const newQuestions = selectNewQuestions(srsRecords).slice(0, remainingCount)

  const sessionQuestions: SessionQuestion[] = [
    ...limitedReviews.map((question) => ({
      question: shuffleOptions(question),
      isReview: true,
    })),
    ...newQuestions.map((question) => ({
      question: shuffleOptions(question),
      isReview: false,
    })),
  ]

  return shuffle(sessionQuestions)
}
