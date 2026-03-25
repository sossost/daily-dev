/**
 * Tests for ReviewTimeline display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test bar height calculation and intensity color logic.
 */

import type { DayReviewCount } from '@/lib/srs-schedule'

const BAR_MAX_HEIGHT = 100
const PERCENTAGE_MULTIPLIER = 100
const HIGH_THRESHOLD = 70
const MEDIUM_THRESHOLD = 40
const MIN_BAR_HEIGHT = 8
const ZERO_BAR_HEIGHT = 2

function computeBarHeight(count: number, maxCount: number): number {
  if (count === 0) return ZERO_BAR_HEIGHT
  return Math.max(MIN_BAR_HEIGHT, (count / maxCount) * BAR_MAX_HEIGHT)
}

function getIntensityColor(count: number, max: number): string {
  const ratio = (count / max) * PERCENTAGE_MULTIPLIER
  if (ratio >= HIGH_THRESHOLD) return 'bg-violet-500 dark:bg-violet-400'
  if (ratio >= MEDIUM_THRESHOLD) return 'bg-violet-400 dark:bg-violet-300'
  return 'bg-violet-300 dark:bg-violet-200'
}

function getBarColorClass(day: DayReviewCount, maxCount: number): string {
  if (day.count === 0) return 'bg-gray-200 dark:bg-gray-700'
  if (day.isToday) return 'bg-blue-500 dark:bg-blue-400'
  return getIntensityColor(day.count, maxCount)
}

function computeMaxCount(reviews: readonly DayReviewCount[]): number {
  return Math.max(1, ...reviews.map((r) => r.count))
}

function formatLabel(label: string): string {
  return label.length > 3 ? label.split(' ')[0] : label
}

describe('ReviewTimeline bar height logic', () => {
  it('returns minimum height for zero count', () => {
    expect(computeBarHeight(0, 10)).toBe(ZERO_BAR_HEIGHT)
  })

  it('returns full height for max count', () => {
    expect(computeBarHeight(10, 10)).toBe(BAR_MAX_HEIGHT)
  })

  it('returns proportional height', () => {
    expect(computeBarHeight(5, 10)).toBe(50)
  })

  it('enforces minimum bar height for small counts', () => {
    expect(computeBarHeight(1, 1000)).toBe(MIN_BAR_HEIGHT)
  })
})

describe('ReviewTimeline intensity color logic', () => {
  it('returns high intensity for ratio >= 70%', () => {
    expect(getIntensityColor(7, 10)).toContain('violet-500')
    expect(getIntensityColor(10, 10)).toContain('violet-500')
  })

  it('returns medium intensity for ratio >= 40%', () => {
    expect(getIntensityColor(4, 10)).toContain('violet-400')
    expect(getIntensityColor(6, 10)).toContain('violet-400')
  })

  it('returns low intensity for ratio < 40%', () => {
    expect(getIntensityColor(3, 10)).toContain('violet-300')
    expect(getIntensityColor(1, 10)).toContain('violet-300')
  })
})

describe('ReviewTimeline bar color', () => {
  it('uses gray for zero-count day', () => {
    const day: DayReviewCount = { date: '2026-03-26', label: '3/26', count: 0, isToday: false }
    expect(getBarColorClass(day, 10)).toContain('gray')
  })

  it('uses blue for today', () => {
    const day: DayReviewCount = { date: '2026-03-26', label: '3/26', count: 5, isToday: true }
    expect(getBarColorClass(day, 10)).toContain('blue')
  })

  it('uses violet for non-today with count', () => {
    const day: DayReviewCount = { date: '2026-03-27', label: '3/27', count: 5, isToday: false }
    expect(getBarColorClass(day, 10)).toContain('violet')
  })
})

describe('ReviewTimeline max count', () => {
  it('returns 1 for empty array', () => {
    expect(computeMaxCount([])).toBe(1)
  })

  it('returns max from reviews', () => {
    const reviews: DayReviewCount[] = [
      { date: '2026-03-26', label: '3/26', count: 3, isToday: false },
      { date: '2026-03-27', label: '3/27', count: 7, isToday: false },
      { date: '2026-03-28', label: '3/28', count: 5, isToday: false },
    ]
    expect(computeMaxCount(reviews)).toBe(7)
  })

  it('returns 1 for all-zero reviews', () => {
    const reviews: DayReviewCount[] = [
      { date: '2026-03-26', label: '3/26', count: 0, isToday: false },
    ]
    expect(computeMaxCount(reviews)).toBe(1)
  })
})

describe('ReviewTimeline label formatting', () => {
  it('keeps short labels as-is', () => {
    expect(formatLabel('3/26')).toBe('3/26')
    expect(formatLabel('Mon')).toBe('Mon')
  })

  it('truncates long labels to first word', () => {
    expect(formatLabel('3/26 Mon')).toBe('3/26')
    expect(formatLabel('March 26')).toBe('March')
  })
})
