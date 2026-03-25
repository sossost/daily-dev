import type { SessionAnswer, Topic } from '@/types'
import type { Locale } from '@/i18n/routing'

const SECONDS_PER_MINUTE = 60

export function formatDuration(totalSeconds: number, locale?: Locale): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE

  if (locale === 'ko') {
    if (minutes === 0) {
      return `${seconds}초`
    }
    return `${minutes}분 ${seconds}초`
  }

  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds}s`
}

export function formatSessionDate(dateStr: string, locale?: Locale): string {
  const [year, month, day] = dateStr.split('-')

  if (locale === 'ko') {
    return `${year}년 ${Number(month)}월 ${Number(day)}일`
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[Number(month) - 1]} ${Number(day)}, ${year}`
}

export interface TopicBreakdownEntry {
  topic: Topic
  correct: number
  total: number
}

export function getTopicBreakdown(answers: readonly SessionAnswer[]): readonly TopicBreakdownEntry[] {
  const map = new Map<Topic, { correct: number; total: number }>()

  for (const answer of answers) {
    const existing = map.get(answer.topic)
    if (existing != null) {
      existing.total += 1
      existing.correct += answer.isCorrect ? 1 : 0
    } else {
      map.set(answer.topic, {
        correct: answer.isCorrect ? 1 : 0,
        total: 1,
      })
    }
  }

  return Array.from(map.entries()).map(([topic, stats]) => ({
    topic,
    ...stats,
  }))
}
