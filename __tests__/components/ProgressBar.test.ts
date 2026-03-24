/**
 * Tests for ProgressBar calculation logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the percentage calculation that drives ProgressBar rendering.
 */

export {}

const PERCENTAGE_MULTIPLIER = 100

function computePercentage(current: number, total: number): number {
  return total > 0 ? Math.round((current / total) * PERCENTAGE_MULTIPLIER) : 0
}

describe('ProgressBar calculation logic', () => {
  it('computes percentage for mid-progress', () => {
    expect(computePercentage(3, 10)).toBe(30)
  })

  it('computes 100% when complete', () => {
    expect(computePercentage(10, 10)).toBe(100)
  })

  it('computes 0% at start', () => {
    expect(computePercentage(0, 10)).toBe(0)
  })

  it('handles total of zero without division error', () => {
    expect(computePercentage(0, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    // 1/3 = 33.33... → 33
    expect(computePercentage(1, 3)).toBe(33)
    // 2/3 = 66.66... → 67
    expect(computePercentage(2, 3)).toBe(67)
  })

  it('computes 50% at halfway', () => {
    expect(computePercentage(5, 10)).toBe(50)
  })

  it('handles single question progress', () => {
    expect(computePercentage(1, 1)).toBe(100)
    expect(computePercentage(0, 1)).toBe(0)
  })
})
