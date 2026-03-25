/**
 * Focus session generator — builds a quiz session targeting the user's weakest areas.
 * Unlike manual practice mode, focus mode auto-selects questions based on performance data:
 * 1. Questions from weak topics (accuracy < 70%)
 * 2. Questions with low SRS ease (frequently answered wrong)
 * 3. Fills remaining slots with questions from least-practiced topics
 */
import type { Question, SessionQuestion, SRSRecord, Topic, TopicStat } from '@/types'
import { SESSION_TOTAL_QUESTIONS, TOPICS } from '@/types'
import type { Locale } from '@/i18n/routing'
import { getAllQuestions } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'
import { shuffle } from '@/lib/shuffle'

const WEAK_ACCURACY_THRESHOLD = 70
const LOW_EASE_THRESHOLD = 2.0
const MIN_ATTEMPTS_FOR_WEAK = 1

export interface FocusAnalysis {
  readonly weakTopics: readonly FocusTopicInfo[]
  readonly strugglingQuestionCount: number
  readonly availableCount: number
}

export interface FocusTopicInfo {
  readonly topic: Topic
  readonly accuracy: number
}

/**
 * Analyze user progress to determine focus areas.
 * Returns weak topics and count of available focus questions.
 */
export function analyzeFocusAreas(
  topicStats: Record<Topic, TopicStat>,
  srsRecords: Record<string, SRSRecord>,
  locale?: Locale,
): FocusAnalysis {
  const weakTopics = TOPICS
    .filter((topic) => {
      const stat = topicStats[topic]
      if (stat == null) return false
      return stat.totalAnswered >= MIN_ATTEMPTS_FOR_WEAK && stat.accuracy < WEAK_ACCURACY_THRESHOLD
    })
    .map((topic) => ({
      topic,
      accuracy: topicStats[topic]?.accuracy ?? 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)

  const strugglingQuestionCount = Object.values(srsRecords)
    .filter((r) => r.ease < LOW_EASE_THRESHOLD)
    .length

  const questions = selectFocusQuestions(topicStats, srsRecords, locale)
  const availableCount = Math.min(questions.length, SESSION_TOTAL_QUESTIONS)

  return { weakTopics, strugglingQuestionCount, availableCount }
}

/**
 * Select questions for a focus session, prioritized by weakness.
 * Priority: low-ease questions > weak-topic questions > least-practiced topics.
 */
export function selectFocusQuestions(
  topicStats: Record<Topic, TopicStat>,
  srsRecords: Record<string, SRSRecord>,
  locale?: Locale,
): Question[] {
  const allQuestions = getAllQuestions(locale)
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

  const weakTopicSet = new Set(
    TOPICS.filter((topic) => {
      const stat = topicStats[topic]
      if (stat == null) return false
      return stat.totalAnswered >= MIN_ATTEMPTS_FOR_WEAK && stat.accuracy < WEAK_ACCURACY_THRESHOLD
    }),
  )

  // Priority 1: Questions with low ease factor (frequently wrong)
  const lowEaseQuestions: Question[] = []
  for (const record of Object.values(srsRecords)) {
    if (record.ease < LOW_EASE_THRESHOLD) {
      const question = questionsById.get(record.questionId)
      if (question != null) {
        lowEaseQuestions.push(question)
      }
    }
  }

  // Priority 2: Unattempted questions from weak topics
  const attemptedIds = new Set(Object.keys(srsRecords))
  const weakTopicQuestions = allQuestions.filter(
    (q) => weakTopicSet.has(q.topic) && !attemptedIds.has(q.id),
  )

  // Priority 3: Questions from least-practiced topics (fill remaining)
  const topicsByAttempts = [...TOPICS]
    .sort((a, b) => (topicStats[a]?.totalAnswered ?? 0) - (topicStats[b]?.totalAnswered ?? 0))

  const leastPracticedQuestions = topicsByAttempts.flatMap((topic) =>
    allQuestions.filter(
      (q) => q.topic === topic && !attemptedIds.has(q.id) && !weakTopicSet.has(q.topic),
    ),
  )

  // Deduplicate and combine, preserving priority order
  const seen = new Set<string>()
  const combined: Question[] = []

  for (const question of [
    ...shuffle(lowEaseQuestions),
    ...shuffle(weakTopicQuestions),
    ...leastPracticedQuestions,
  ]) {
    if (!seen.has(question.id)) {
      seen.add(question.id)
      combined.push(question)
    }
  }

  return combined
}

/**
 * Generate a focus session targeting the user's weakest areas.
 * Returns up to SESSION_TOTAL_QUESTIONS questions with options shuffled.
 */
export function generateFocusSession(
  topicStats: Record<Topic, TopicStat>,
  srsRecords: Record<string, SRSRecord>,
  locale?: Locale,
): SessionQuestion[] {
  const selected = selectFocusQuestions(topicStats, srsRecords, locale)
    .slice(0, SESSION_TOTAL_QUESTIONS)

  return selected.map((question) => ({
    question: shuffleOptions(question),
    isReview: true,
  }))
}
