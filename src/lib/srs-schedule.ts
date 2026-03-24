/**
 * SRS schedule utilities — compute upcoming review distribution
 * from SRS records for visualization.
 */
import type { SRSRecord, Topic } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { getToday, addDays, isBeforeOrEqual } from '@/lib/date'
import { getQuestionById } from '@/lib/questions'

const SCHEDULE_DAYS = 14
const PERCENTAGE_MULTIPLIER = 100
const MASTERED_INTERVAL_THRESHOLD = 21

export interface DayReviewCount {
  readonly date: string
  readonly label: string
  readonly count: number
  readonly isToday: boolean
}

export interface TopicReviewCount {
  readonly topic: Topic
  readonly label: string
  readonly dueCount: number
  readonly totalCount: number
}

export interface ScheduleSummary {
  readonly dueToday: number
  readonly dueThisWeek: number
  readonly totalTracked: number
  readonly masteredCount: number
  readonly masteredPercentage: number
}

/**
 * Get the number of reviews due each day for the next SCHEDULE_DAYS days.
 */
export function getUpcomingReviews(
  srsRecords: Record<string, SRSRecord>,
): readonly DayReviewCount[] {
  const today = getToday()
  const records = Object.values(srsRecords)
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const date = addDays(today, i)
    const count = records.filter((r) => r.nextReview === date).length

    // Also count overdue items on today
    const overdueCount =
      i === 0
        ? records.filter(
            (r) => r.nextReview < today,
          ).length
        : 0

    const [year, month, day] = date.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayName = dayNames[dateObj.getDay()]
    const label = i === 0 ? '오늘' : i === 1 ? '내일' : `${month}/${day} (${dayName})`

    return {
      date,
      label,
      count: count + overdueCount,
      isToday: i === 0,
    }
  })
}

/**
 * Get review counts grouped by topic for questions due today or overdue.
 */
export function getDueByTopic(
  srsRecords: Record<string, SRSRecord>,
): readonly TopicReviewCount[] {
  const today = getToday()
  const records = Object.values(srsRecords)

  const topicMap = new Map<Topic, { due: number; total: number }>()

  for (const record of records) {
    const question = getQuestionById(record.questionId)
    if (question == null) continue

    const { topic } = question
    const existing = topicMap.get(topic) ?? { due: 0, total: 0 }
    const isDue = isBeforeOrEqual(record.nextReview, today)

    topicMap.set(topic, {
      due: existing.due + (isDue ? 1 : 0),
      total: existing.total + 1,
    })
  }

  return Array.from(topicMap.entries())
    .map(([topic, counts]) => ({
      topic,
      label: TOPIC_LABELS[topic],
      dueCount: counts.due,
      totalCount: counts.total,
    }))
    .filter((entry) => entry.totalCount > 0)
    .sort((a, b) => b.dueCount - a.dueCount)
}

/**
 * Compute summary statistics for the SRS schedule.
 */
export function getScheduleSummary(
  srsRecords: Record<string, SRSRecord>,
): ScheduleSummary {
  const today = getToday()
  const weekEnd = addDays(today, 7)
  const records = Object.values(srsRecords)
  const totalTracked = records.length

  if (totalTracked === 0) {
    return { dueToday: 0, dueThisWeek: 0, totalTracked: 0, masteredCount: 0, masteredPercentage: 0 }
  }

  const dueToday = records.filter((r) => isBeforeOrEqual(r.nextReview, today)).length
  const dueThisWeek = records.filter((r) => isBeforeOrEqual(r.nextReview, weekEnd)).length
  const masteredCount = records.filter((r) => r.interval >= MASTERED_INTERVAL_THRESHOLD).length
  const masteredPercentage = Math.round(
    (masteredCount / totalTracked) * PERCENTAGE_MULTIPLIER,
  )

  return { dueToday, dueThisWeek, totalTracked, masteredCount, masteredPercentage }
}
