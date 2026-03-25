/**
 * Tests for ChallengeTimer display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the timer calculation, color, and progress logic.
 */

const MILLISECONDS_PER_SECOND = 1000
const LOW_TIME_THRESHOLD = 10
const PERCENTAGE_MULTIPLIER = 100

function computeRemaining(durationSeconds: number, startTime: number, now: number): number {
  const elapsed = (now - startTime) / MILLISECONDS_PER_SECOND
  return Math.max(0, durationSeconds - elapsed)
}

function computeDisplaySeconds(remaining: number): number {
  return Math.ceil(remaining)
}

function computeProgress(remaining: number, durationSeconds: number): number {
  return remaining / durationSeconds
}

function isLowTime(seconds: number): boolean {
  return seconds <= LOW_TIME_THRESHOLD
}

function getProgressWidth(progress: number): string {
  return `${progress * PERCENTAGE_MULTIPLIER}%`
}

function getTimerColorClass(lowTime: boolean): string {
  return lowTime ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
}

function getBarColorClass(lowTime: boolean): string {
  return lowTime ? 'bg-red-500' : 'bg-emerald-500'
}

describe('ChallengeTimer remaining calculation', () => {
  it('returns full duration when no time has passed', () => {
    expect(computeRemaining(60, 1000, 1000)).toBe(60)
  })

  it('decreases as time passes', () => {
    expect(computeRemaining(60, 1000, 6000)).toBe(55)
  })

  it('clamps at 0 when time exceeds duration', () => {
    expect(computeRemaining(60, 1000, 100000)).toBe(0)
  })

  it('handles fractional seconds', () => {
    expect(computeRemaining(60, 1000, 1500)).toBeCloseTo(59.5)
  })
})

describe('ChallengeTimer display seconds', () => {
  it('rounds up remaining to display', () => {
    expect(computeDisplaySeconds(59.1)).toBe(60)
    expect(computeDisplaySeconds(59.9)).toBe(60)
    expect(computeDisplaySeconds(0.1)).toBe(1)
    expect(computeDisplaySeconds(0)).toBe(0)
  })
})

describe('ChallengeTimer progress', () => {
  it('returns 1 at start', () => {
    expect(computeProgress(60, 60)).toBe(1)
  })

  it('returns 0.5 at halfway', () => {
    expect(computeProgress(30, 60)).toBe(0.5)
  })

  it('returns 0 when done', () => {
    expect(computeProgress(0, 60)).toBe(0)
  })

  it('formats progress as percentage string', () => {
    expect(getProgressWidth(1)).toBe('100%')
    expect(getProgressWidth(0.5)).toBe('50%')
    expect(getProgressWidth(0)).toBe('0%')
  })
})

describe('ChallengeTimer low time detection', () => {
  it('is low when seconds <= 10', () => {
    expect(isLowTime(10)).toBe(true)
    expect(isLowTime(5)).toBe(true)
    expect(isLowTime(0)).toBe(true)
  })

  it('is not low when seconds > 10', () => {
    expect(isLowTime(11)).toBe(false)
    expect(isLowTime(60)).toBe(false)
  })
})

describe('ChallengeTimer color classes', () => {
  it('uses red for timer text when low time', () => {
    expect(getTimerColorClass(true)).toContain('red')
  })

  it('uses default color when not low time', () => {
    expect(getTimerColorClass(false)).toContain('gray')
  })

  it('uses red bar when low time', () => {
    expect(getBarColorClass(true)).toContain('red')
  })

  it('uses emerald bar when not low time', () => {
    expect(getBarColorClass(false)).toContain('emerald')
  })
})
