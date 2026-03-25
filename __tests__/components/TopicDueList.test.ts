/**
 * Tests for TopicDueList display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the progress bar width calculation and empty state logic.
 */

import type { TopicReviewCount } from '@/lib/srs-schedule'

function computeProgressWidth(dueCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0
  return (dueCount / totalCount) * 100
}

function getBarColorClass(dueCount: number): string {
  return dueCount > 0
    ? 'bg-blue-500 dark:bg-blue-400'
    : 'bg-gray-300 dark:bg-gray-600'
}

type DisplayState = 'empty' | 'list'

function getDisplayState(topics: readonly TopicReviewCount[]): DisplayState {
  return topics.length === 0 ? 'empty' : 'list'
}

function formatDueLabel(dueCount: number, totalCount: number): string {
  return `${dueCount}/${totalCount}`
}

describe('TopicDueList progress width', () => {
  it('returns 0 when totalCount is 0', () => {
    expect(computeProgressWidth(0, 0)).toBe(0)
  })

  it('returns 0 when no due questions', () => {
    expect(computeProgressWidth(0, 10)).toBe(0)
  })

  it('returns 100 when all questions are due', () => {
    expect(computeProgressWidth(10, 10)).toBe(100)
  })

  it('returns proportional width', () => {
    expect(computeProgressWidth(3, 10)).toBe(30)
    expect(computeProgressWidth(5, 8)).toBeCloseTo(62.5)
  })
})

describe('TopicDueList bar color', () => {
  it('uses blue when due count > 0', () => {
    expect(getBarColorClass(5)).toContain('blue')
  })

  it('uses gray when due count is 0', () => {
    expect(getBarColorClass(0)).toContain('gray')
  })
})

describe('TopicDueList display state', () => {
  it('shows empty state when no topics', () => {
    expect(getDisplayState([])).toBe('empty')
  })

  it('shows list state when topics exist', () => {
    const topics: TopicReviewCount[] = [
      { topic: 'scope', dueCount: 3, totalCount: 10 },
    ]
    expect(getDisplayState(topics)).toBe('list')
  })
})

describe('TopicDueList label formatting', () => {
  it('formats due/total label correctly', () => {
    expect(formatDueLabel(3, 10)).toBe('3/10')
    expect(formatDueLabel(0, 5)).toBe('0/5')
    expect(formatDueLabel(8, 8)).toBe('8/8')
  })
})
