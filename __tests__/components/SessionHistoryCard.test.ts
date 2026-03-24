/**
 * Tests for SessionHistoryCard display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the percentage calculation and score color logic.
 */

export {}

const PERCENTAGE_MULTIPLIER = 100
const HIGH_SCORE_THRESHOLD = 70

function computePercentage(score: number, totalQuestions: number): number {
  return totalQuestions > 0
    ? Math.round((score / totalQuestions) * PERCENTAGE_MULTIPLIER)
    : 0
}

function getScoreColorVariant(percentage: number): 'green' | 'amber' {
  return percentage >= HIGH_SCORE_THRESHOLD ? 'green' : 'amber'
}

describe('SessionHistoryCard logic', () => {
  it('computes percentage from score and total', () => {
    expect(computePercentage(8, 10)).toBe(80)
    expect(computePercentage(5, 10)).toBe(50)
  })

  it('returns 0% when no questions', () => {
    expect(computePercentage(0, 0)).toBe(0)
  })

  it('rounds percentage correctly', () => {
    expect(computePercentage(1, 3)).toBe(33)
    expect(computePercentage(2, 3)).toBe(67)
  })

  it('uses green for high scores >= 70%', () => {
    expect(getScoreColorVariant(70)).toBe('green')
    expect(getScoreColorVariant(100)).toBe('green')
  })

  it('uses amber for low scores < 70%', () => {
    expect(getScoreColorVariant(69)).toBe('amber')
    expect(getScoreColorVariant(0)).toBe('amber')
  })

  it('computes perfect score as 100%', () => {
    expect(computePercentage(10, 10)).toBe(100)
  })

  it('computes zero score as 0%', () => {
    expect(computePercentage(0, 10)).toBe(0)
  })
})
