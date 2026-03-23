/**
 * Statistics computation utilities.
 * Pure functions that derive analytics from UserProgress data.
 */
import type { SessionRecord, Topic, TopicStat } from '@/types'
import { TOPICS, TOPIC_LABELS } from '@/types'

const PERCENTAGE_MULTIPLIER = 100
const RECENT_SESSIONS_LIMIT = 10

export interface AccuracyPoint {
  readonly sessionIndex: number
  readonly date: string
  readonly accuracy: number
  readonly score: number
  readonly total: number
}

export interface WeakTopic {
  readonly topic: Topic
  readonly label: string
  readonly accuracy: number
  readonly totalAnswered: number
}

/**
 * Compute accuracy trend from the most recent sessions.
 */
export function getAccuracyTrend(sessions: readonly SessionRecord[]): readonly AccuracyPoint[] {
  const recent = sessions.slice(-RECENT_SESSIONS_LIMIT)
  return recent.map((session, index) => ({
    sessionIndex: index + 1,
    date: session.date,
    accuracy:
      session.totalQuestions > 0
        ? Math.round((session.score / session.totalQuestions) * PERCENTAGE_MULTIPLIER)
        : 0,
    score: session.score,
    total: session.totalQuestions,
  }))
}

const WEAK_TOPIC_THRESHOLD = 70
const MIN_ATTEMPTS_FOR_WEAK = 1

/**
 * Identify weak topics — topics with accuracy below threshold.
 * Sorted by accuracy ascending (weakest first).
 */
export function getWeakTopics(
  topicStats: Record<Topic, TopicStat>,
): readonly WeakTopic[] {
  return TOPICS
    .filter((topic) => {
      const stat = topicStats[topic]
      return stat.totalAnswered >= MIN_ATTEMPTS_FOR_WEAK && stat.accuracy < WEAK_TOPIC_THRESHOLD
    })
    .map((topic) => ({
      topic,
      label: TOPIC_LABELS[topic],
      accuracy: topicStats[topic].accuracy,
      totalAnswered: topicStats[topic].totalAnswered,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

/**
 * Compute overall accuracy percentage.
 */
export function getOverallAccuracy(totalCorrect: number, totalAnswered: number): number {
  if (totalAnswered === 0) return 0
  return Math.round((totalCorrect / totalAnswered) * PERCENTAGE_MULTIPLIER)
}

/**
 * Count how many topics have been attempted.
 */
export function getAttemptedTopicCount(topicStats: Record<Topic, TopicStat>): number {
  return TOPICS.filter((topic) => topicStats[topic].totalAnswered > 0).length
}

/**
 * Get best and worst performing topic.
 * Only considers topics with at least one answer.
 */
export function getBestAndWorstTopics(
  topicStats: Record<Topic, TopicStat>,
): { best: WeakTopic | null; worst: WeakTopic | null } {
  const attempted = TOPICS
    .filter((topic) => topicStats[topic].totalAnswered > 0)
    .map((topic) => ({
      topic,
      label: TOPIC_LABELS[topic],
      accuracy: topicStats[topic].accuracy,
      totalAnswered: topicStats[topic].totalAnswered,
    }))

  if (attempted.length === 0) return { best: null, worst: null }

  const sorted = [...attempted].sort((a, b) => a.accuracy - b.accuracy)
  return {
    best: sorted[sorted.length - 1],
    worst: sorted[0],
  }
}
