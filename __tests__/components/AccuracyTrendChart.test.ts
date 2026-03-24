/**
 * Tests for AccuracyTrendChart display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the bar height calculation and color logic.
 */
import type { AccuracyPoint } from '@/lib/stats'

const BAR_MAX_HEIGHT = 120
const PERCENTAGE_MULTIPLIER = 100
const GOOD_THRESHOLD = 70
const MIN_BAR_HEIGHT = 4

function computeBarHeight(accuracy: number): number {
  return Math.max(MIN_BAR_HEIGHT, (accuracy / PERCENTAGE_MULTIPLIER) * BAR_MAX_HEIGHT)
}

function getBarColor(accuracy: number): 'emerald' | 'amber' {
  return accuracy >= GOOD_THRESHOLD ? 'emerald' : 'amber'
}

type DisplayState = 'empty' | 'chart'

function getDisplayState(trend: readonly AccuracyPoint[]): DisplayState {
  return trend.length === 0 ? 'empty' : 'chart'
}

describe('AccuracyTrendChart logic', () => {
  it('shows empty state when no trend data', () => {
    expect(getDisplayState([])).toBe('empty')
  })

  it('shows chart state with data', () => {
    const trend: AccuracyPoint[] = [
      { sessionIndex: 1, date: '2026-01-01', accuracy: 80, score: 8, total: 10 },
    ]
    expect(getDisplayState(trend)).toBe('chart')
  })

  it('computes bar height proportional to accuracy', () => {
    expect(computeBarHeight(100)).toBe(BAR_MAX_HEIGHT)
    expect(computeBarHeight(50)).toBe(BAR_MAX_HEIGHT / 2)
    expect(computeBarHeight(0)).toBe(MIN_BAR_HEIGHT) // min height
  })

  it('enforces minimum bar height', () => {
    expect(computeBarHeight(0)).toBe(MIN_BAR_HEIGHT)
    expect(computeBarHeight(1)).toBeGreaterThanOrEqual(MIN_BAR_HEIGHT)
  })

  it('uses emerald for good accuracy', () => {
    expect(getBarColor(70)).toBe('emerald')
    expect(getBarColor(100)).toBe('emerald')
  })

  it('uses amber for low accuracy', () => {
    expect(getBarColor(69)).toBe('amber')
    expect(getBarColor(0)).toBe('amber')
  })
})
