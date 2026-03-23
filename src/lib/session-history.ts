import type { SessionAnswer, Topic } from '@/types'

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / MS_PER_SECOND)
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE

  if (minutes === 0) {
    return `${seconds}초`
  }
  return `${minutes}분 ${seconds}초`
}

export function formatSessionDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${year}년 ${Number(month)}월 ${Number(day)}일`
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
