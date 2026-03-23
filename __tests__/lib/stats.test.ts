import type { SessionRecord, Topic, TopicStat } from '@/types'
import { DEFAULT_USER_PROGRESS, TOPICS } from '@/types'
import {
  getAccuracyTrend,
  getWeakTopics,
  getOverallAccuracy,
  getAttemptedTopicCount,
  getBestAndWorstTopics,
} from '@/lib/stats'

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `session-${Date.now()}`,
    date: '2026-03-24',
    answers: [],
    score: 7,
    totalQuestions: 10,
    duration: 60000,
    ...overrides,
  }
}

function makeTopicStats(
  overrides: Partial<Record<Topic, Partial<TopicStat>>> = {},
): Record<Topic, TopicStat> {
  const base = { ...DEFAULT_USER_PROGRESS.topicStats }
  for (const [topic, partial] of Object.entries(overrides)) {
    base[topic as Topic] = { ...base[topic as Topic], ...partial }
  }
  return base
}

describe('getOverallAccuracy', () => {
  it('returns 0 when no questions answered', () => {
    expect(getOverallAccuracy(0, 0)).toBe(0)
  })

  it('calculates percentage correctly', () => {
    expect(getOverallAccuracy(7, 10)).toBe(70)
    expect(getOverallAccuracy(10, 10)).toBe(100)
    expect(getOverallAccuracy(1, 3)).toBe(33)
  })
})

describe('getAccuracyTrend', () => {
  it('returns empty array for no sessions', () => {
    expect(getAccuracyTrend([])).toEqual([])
  })

  it('computes accuracy for each session', () => {
    const sessions = [
      makeSession({ score: 8, totalQuestions: 10 }),
      makeSession({ score: 5, totalQuestions: 10 }),
    ]
    const trend = getAccuracyTrend(sessions)
    expect(trend).toHaveLength(2)
    expect(trend[0].accuracy).toBe(80)
    expect(trend[1].accuracy).toBe(50)
  })

  it('limits to last 10 sessions', () => {
    const sessions = Array.from({ length: 15 }, (_, i) =>
      makeSession({ score: i, totalQuestions: 10 }),
    )
    const trend = getAccuracyTrend(sessions)
    expect(trend).toHaveLength(10)
    expect(trend[0].accuracy).toBe(50) // session index 5
  })
})

describe('getWeakTopics', () => {
  it('returns empty when all topics are above threshold', () => {
    const stats = makeTopicStats({
      scope: { totalAnswered: 10, accuracy: 90 },
      closure: { totalAnswered: 10, accuracy: 80 },
    })
    expect(getWeakTopics(stats)).toEqual([])
  })

  it('identifies topics below 70%', () => {
    const stats = makeTopicStats({
      scope: { totalAnswered: 10, accuracy: 50 },
      closure: { totalAnswered: 10, accuracy: 90 },
      prototype: { totalAnswered: 5, accuracy: 60 },
    })
    const weak = getWeakTopics(stats)
    expect(weak).toHaveLength(2)
    expect(weak[0].topic).toBe('scope')
    expect(weak[1].topic).toBe('prototype')
  })

  it('ignores unattempted topics', () => {
    const stats = makeTopicStats({
      scope: { totalAnswered: 0, accuracy: 0 },
    })
    expect(getWeakTopics(stats)).toEqual([])
  })
})

describe('getAttemptedTopicCount', () => {
  it('returns 0 when nothing attempted', () => {
    expect(getAttemptedTopicCount(DEFAULT_USER_PROGRESS.topicStats)).toBe(0)
  })

  it('counts topics with answers', () => {
    const stats = makeTopicStats({
      scope: { totalAnswered: 5 },
      closure: { totalAnswered: 3 },
    })
    expect(getAttemptedTopicCount(stats)).toBe(2)
  })
})

describe('getBestAndWorstTopics', () => {
  it('returns nulls when nothing attempted', () => {
    const { best, worst } = getBestAndWorstTopics(DEFAULT_USER_PROGRESS.topicStats)
    expect(best).toBeNull()
    expect(worst).toBeNull()
  })

  it('identifies best and worst', () => {
    const stats = makeTopicStats({
      scope: { totalAnswered: 10, accuracy: 90 },
      closure: { totalAnswered: 10, accuracy: 40 },
      prototype: { totalAnswered: 10, accuracy: 70 },
    })
    const { best, worst } = getBestAndWorstTopics(stats)
    expect(best?.topic).toBe('scope')
    expect(worst?.topic).toBe('closure')
  })
})
