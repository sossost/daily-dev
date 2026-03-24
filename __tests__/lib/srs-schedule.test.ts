import { getUpcomingReviews, getDueByTopic, getScheduleSummary } from '@/lib/srs-schedule'
import type { SRSRecord } from '@/types'
import * as dateModule from '@/lib/date'

jest.spyOn(dateModule, 'getToday').mockReturnValue('2024-06-01')

const makeRecord = (
  questionId: string,
  nextReview: string,
  overrides: Partial<SRSRecord> = {},
): SRSRecord => ({
  questionId,
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview,
  lastReview: '2024-05-31',
  ...overrides,
})

describe('getUpcomingReviews', () => {
  it('returns 14 days of review counts', () => {
    const records: Record<string, SRSRecord> = {}
    const result = getUpcomingReviews(records)

    expect(result).toHaveLength(14)
    expect(result[0].isToday).toBe(true)
    expect(result[0].label).toBe('오늘')
    expect(result[1].label).toBe('내일')
  })

  it('counts reviews due on specific days', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-06-01'),
      'scope-002': makeRecord('scope-002', '2024-06-01'),
      'scope-003': makeRecord('scope-003', '2024-06-03'),
    }

    const result = getUpcomingReviews(records)

    expect(result[0].count).toBe(2) // today: 2 due
    expect(result[1].count).toBe(0) // tomorrow: 0
    expect(result[2].count).toBe(1) // day after: 1
  })

  it('includes overdue items in today count', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-05-28'), // overdue
      'scope-002': makeRecord('scope-002', '2024-06-01'), // today
    }

    const result = getUpcomingReviews(records)
    expect(result[0].count).toBe(2)
  })

  it('returns all zeros for empty records', () => {
    const result = getUpcomingReviews({})
    const allZero = result.every((d) => d.count === 0)
    expect(allZero).toBe(true)
  })
})

describe('getDueByTopic', () => {
  it('returns empty array for no records', () => {
    expect(getDueByTopic({})).toEqual([])
  })

  it('groups due counts by topic', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-06-01'), // due today
      'scope-002': makeRecord('scope-002', '2024-06-05'), // not due
      'closure-001': makeRecord('closure-001', '2024-05-30'), // overdue
    }

    const result = getDueByTopic(records)

    const scopeEntry = result.find((r) => r.topic === 'scope')
    expect(scopeEntry).toBeDefined()
    expect(scopeEntry?.dueCount).toBe(1)
    expect(scopeEntry?.totalCount).toBe(2)

    const closureEntry = result.find((r) => r.topic === 'closure')
    expect(closureEntry).toBeDefined()
    expect(closureEntry?.dueCount).toBe(1)
    expect(closureEntry?.totalCount).toBe(1)
  })

  it('sorts by due count descending', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-06-01'),
      'closure-001': makeRecord('closure-001', '2024-06-01'),
      'closure-002': makeRecord('closure-002', '2024-06-01'),
    }

    const result = getDueByTopic(records)
    if (result.length >= 2) {
      expect(result[0].dueCount).toBeGreaterThanOrEqual(result[1].dueCount)
    }
  })
})

describe('getScheduleSummary', () => {
  it('returns zeros for empty records', () => {
    const summary = getScheduleSummary({})
    expect(summary.dueToday).toBe(0)
    expect(summary.dueThisWeek).toBe(0)
    expect(summary.totalTracked).toBe(0)
    expect(summary.masteredCount).toBe(0)
    expect(summary.masteredPercentage).toBe(0)
  })

  it('computes correct summary stats', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-06-01', { interval: 1 }), // due today, not mastered
      'scope-002': makeRecord('scope-002', '2024-06-03', { interval: 6 }), // due this week, not mastered
      'scope-003': makeRecord('scope-003', '2024-06-15', { interval: 30 }), // mastered, not due this week
      'scope-004': makeRecord('scope-004', '2024-05-29', { interval: 25 }), // overdue, mastered
    }

    const summary = getScheduleSummary(records)

    expect(summary.totalTracked).toBe(4)
    expect(summary.dueToday).toBe(2) // scope-001 (today) + scope-004 (overdue)
    expect(summary.dueThisWeek).toBe(3) // scope-001, scope-002, scope-004
    expect(summary.masteredCount).toBe(2) // scope-003 (interval 30) + scope-004 (interval 25)
    expect(summary.masteredPercentage).toBe(50)
  })

  it('counts items with interval >= 21 as mastered', () => {
    const records: Record<string, SRSRecord> = {
      'scope-001': makeRecord('scope-001', '2024-06-15', { interval: 21 }),
      'scope-002': makeRecord('scope-002', '2024-06-15', { interval: 20 }),
    }

    const summary = getScheduleSummary(records)
    expect(summary.masteredCount).toBe(1)
  })
})
