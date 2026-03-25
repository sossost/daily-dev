import { formatDuration, formatSessionDate, getTopicBreakdown } from '@/lib/session-history'
import type { SessionAnswer } from '@/types'

describe('formatDuration', () => {
  it('formats seconds only when under a minute (default: English)', () => {
    expect(formatDuration(5)).toBe('5s')
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s')
    expect(formatDuration(125)).toBe('2m 5s')
  })

  it('formats in Korean when locale is ko', () => {
    expect(formatDuration(5, 'ko')).toBe('5초')
    expect(formatDuration(90, 'ko')).toBe('1분 30초')
  })
})

describe('formatSessionDate', () => {
  it('formats a date string in English by default', () => {
    expect(formatSessionDate('2026-03-23')).toBe('Mar 23, 2026')
  })

  it('strips leading zeros from month and day', () => {
    expect(formatSessionDate('2026-01-05')).toBe('Jan 5, 2026')
  })

  it('handles double-digit month and day', () => {
    expect(formatSessionDate('2026-12-31')).toBe('Dec 31, 2026')
  })

  it('formats in Korean when locale is ko', () => {
    expect(formatSessionDate('2026-03-23', 'ko')).toBe('2026년 3월 23일')
  })
})

describe('getTopicBreakdown', () => {
  it('returns empty array for no answers', () => {
    expect(getTopicBreakdown([])).toEqual([])
  })

  it('groups answers by topic', () => {
    const answers: SessionAnswer[] = [
      { questionId: 'scope-001', topic: 'scope', selectedIndex: 0, isCorrect: true, timeSpent: 5000 },
      { questionId: 'scope-002', topic: 'scope', selectedIndex: 1, isCorrect: false, timeSpent: 3000 },
      { questionId: 'closure-001', topic: 'closure', selectedIndex: 0, isCorrect: true, timeSpent: 4000 },
    ]

    const result = getTopicBreakdown(answers)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ topic: 'scope', correct: 1, total: 2 })
    expect(result[1]).toEqual({ topic: 'closure', correct: 1, total: 1 })
  })

  it('handles all correct answers', () => {
    const answers: SessionAnswer[] = [
      { questionId: 'async-001', topic: 'async', selectedIndex: 0, isCorrect: true, timeSpent: 2000 },
      { questionId: 'async-002', topic: 'async', selectedIndex: 1, isCorrect: true, timeSpent: 3000 },
    ]

    const result = getTopicBreakdown(answers)

    expect(result).toEqual([{ topic: 'async', correct: 2, total: 2 }])
  })

  it('handles all incorrect answers', () => {
    const answers: SessionAnswer[] = [
      { questionId: 'this-001', topic: 'this', selectedIndex: 0, isCorrect: false, timeSpent: 6000 },
    ]

    const result = getTopicBreakdown(answers)

    expect(result).toEqual([{ topic: 'this', correct: 0, total: 1 }])
  })

  it('preserves insertion order of topics', () => {
    const answers: SessionAnswer[] = [
      { questionId: 'closure-001', topic: 'closure', selectedIndex: 0, isCorrect: true, timeSpent: 1000 },
      { questionId: 'scope-001', topic: 'scope', selectedIndex: 0, isCorrect: true, timeSpent: 2000 },
      { questionId: 'async-001', topic: 'async', selectedIndex: 0, isCorrect: false, timeSpent: 3000 },
    ]

    const result = getTopicBreakdown(answers)

    expect(result[0]?.topic).toBe('closure')
    expect(result[1]?.topic).toBe('scope')
    expect(result[2]?.topic).toBe('async')
  })
})
