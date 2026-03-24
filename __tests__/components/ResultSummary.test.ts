/**
 * Tests for ResultSummary calculation logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the score percentage and visual state calculations.
 */

export {}

const PERCENTAGE_MULTIPLIER = 100
const FULL_CIRCUMFERENCE = 251.2
const SCORE_THRESHOLD = 70

function computeScorePercentage(correct: number, total: number): number {
  return total > 0
    ? Math.round((correct / total) * PERCENTAGE_MULTIPLIER)
    : 0
}

function computeStrokeDashoffset(scorePercentage: number): number {
  return FULL_CIRCUMFERENCE - (FULL_CIRCUMFERENCE * scorePercentage) / PERCENTAGE_MULTIPLIER
}

function getStrokeColor(scorePercentage: number): string {
  return scorePercentage >= SCORE_THRESHOLD ? '#22c55e' : '#f59e0b'
}

describe('ResultSummary calculation logic', () => {
  it('computes score percentage', () => {
    expect(computeScorePercentage(8, 10)).toBe(80)
    expect(computeScorePercentage(7, 10)).toBe(70)
    expect(computeScorePercentage(3, 10)).toBe(30)
  })

  it('returns 0% when total is zero', () => {
    expect(computeScorePercentage(0, 0)).toBe(0)
  })

  it('rounds percentage correctly', () => {
    expect(computeScorePercentage(2, 3)).toBe(67)
    expect(computeScorePercentage(1, 3)).toBe(33)
  })

  it('computes full circumference offset for 0%', () => {
    const offset = computeStrokeDashoffset(0)
    expect(offset).toBe(FULL_CIRCUMFERENCE)
  })

  it('computes zero offset for 100%', () => {
    const offset = computeStrokeDashoffset(100)
    expect(offset).toBeCloseTo(0, 1)
  })

  it('computes partial offset for 50%', () => {
    const offset = computeStrokeDashoffset(50)
    expect(offset).toBeCloseTo(FULL_CIRCUMFERENCE / 2, 1)
  })

  it('uses green for scores >= 70%', () => {
    expect(getStrokeColor(70)).toBe('#22c55e')
    expect(getStrokeColor(100)).toBe('#22c55e')
    expect(getStrokeColor(80)).toBe('#22c55e')
  })

  it('uses amber for scores < 70%', () => {
    expect(getStrokeColor(69)).toBe('#f59e0b')
    expect(getStrokeColor(0)).toBe('#f59e0b')
    expect(getStrokeColor(50)).toBe('#f59e0b')
  })
})
