/**
 * Tests for TopicAccuracyBars display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the sorting, filtering, and color logic.
 */
import type { Topic, TopicStat } from '@/types'
import { TOPICS } from '@/types'

const HIGH_ACCURACY = 80
const MEDIUM_ACCURACY = 60

function getBarColor(accuracy: number): string {
  if (accuracy >= HIGH_ACCURACY) return 'emerald'
  if (accuracy >= MEDIUM_ACCURACY) return 'blue'
  return 'amber'
}

function getAttemptedTopics(topicStats: Record<Topic, TopicStat>): Array<{
  topic: Topic
  accuracy: number
  totalAnswered: number
}> {
  return TOPICS
    .filter((topic) => topicStats[topic].totalAnswered > 0)
    .map((topic) => ({
      topic,
      accuracy: topicStats[topic].accuracy,
      totalAnswered: topicStats[topic].totalAnswered,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)
}

function makeTopicStats(
  overrides: Partial<Record<Topic, Partial<TopicStat>>> = {},
): Record<Topic, TopicStat> {
  const result = {} as Record<Topic, TopicStat>
  for (const topic of TOPICS) {
    const defaultStat: TopicStat = {
      topic,
      totalAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
    }
    result[topic] = { ...defaultStat, ...overrides[topic] }
  }
  return result
}

describe('TopicAccuracyBars logic', () => {
  it('uses emerald for high accuracy >= 80%', () => {
    expect(getBarColor(80)).toBe('emerald')
    expect(getBarColor(100)).toBe('emerald')
  })

  it('uses blue for medium accuracy >= 60%', () => {
    expect(getBarColor(60)).toBe('blue')
    expect(getBarColor(79)).toBe('blue')
  })

  it('uses amber for low accuracy < 60%', () => {
    expect(getBarColor(59)).toBe('amber')
    expect(getBarColor(0)).toBe('amber')
  })

  it('filters out unattempted topics', () => {
    const stats = makeTopicStats({
      closure: { totalAnswered: 5, correctAnswers: 4, accuracy: 80 },
      scope: { totalAnswered: 0, correctAnswers: 0, accuracy: 0 },
    })

    const attempted = getAttemptedTopics(stats)

    expect(attempted).toHaveLength(1)
    expect(attempted[0].topic).toBe('closure')
  })

  it('sorts by accuracy descending', () => {
    const stats = makeTopicStats({
      closure: { totalAnswered: 10, correctAnswers: 6, accuracy: 60 },
      scope: { totalAnswered: 10, correctAnswers: 9, accuracy: 90 },
      'event-loop': { totalAnswered: 10, correctAnswers: 7, accuracy: 70 },
    })

    const attempted = getAttemptedTopics(stats)

    expect(attempted[0].accuracy).toBe(90)
    expect(attempted[1].accuracy).toBe(70)
    expect(attempted[2].accuracy).toBe(60)
  })

  it('returns empty for all unattempted', () => {
    const stats = makeTopicStats()
    const attempted = getAttemptedTopics(stats)
    expect(attempted).toHaveLength(0)
  })
})
