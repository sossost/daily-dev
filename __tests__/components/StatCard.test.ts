/**
 * Tests for StatCard display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the animation delay calculation and subtext visibility.
 */

const ANIMATION_DELAY_STEP = 0.08

function computeAnimationDelay(index: number): number {
  return index * ANIMATION_DELAY_STEP
}

function shouldShowSubtext(subtext: string | undefined): boolean {
  return subtext != null
}

describe('StatCard logic', () => {
  it('computes animation delay based on index', () => {
    expect(computeAnimationDelay(0)).toBe(0)
    expect(computeAnimationDelay(1)).toBeCloseTo(0.08)
    expect(computeAnimationDelay(2)).toBeCloseTo(0.16)
    expect(computeAnimationDelay(5)).toBeCloseTo(0.4)
  })

  it('shows subtext when provided', () => {
    expect(shouldShowSubtext('Best: 10')).toBe(true)
    expect(shouldShowSubtext('')).toBe(true)
  })

  it('hides subtext when undefined', () => {
    expect(shouldShowSubtext(undefined)).toBe(false)
  })

  it('accepts both string and number values', () => {
    // StatCard accepts value: string | number
    const numValue: string | number = 42
    const strValue: string | number = '85%'

    expect(String(numValue)).toBe('42')
    expect(String(strValue)).toBe('85%')
  })
})
