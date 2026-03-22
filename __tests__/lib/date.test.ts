import { getToday, formatDate, addDays, isBeforeOrEqual, isValidDateString } from '@/lib/date'

describe('getToday', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const today = getToday()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a valid date string', () => {
    const today = getToday()
    expect(isValidDateString(today)).toBe(true)
  })
})

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const date = new Date(2024, 0, 15) // Jan 15, 2024
    expect(formatDate(date)).toBe('2024-01-15')
  })

  it('pads single digit month and day', () => {
    const date = new Date(2024, 2, 5) // Mar 5, 2024
    expect(formatDate(date)).toBe('2024-03-05')
  })

  it('handles December correctly', () => {
    const date = new Date(2024, 11, 31) // Dec 31, 2024
    expect(formatDate(date)).toBe('2024-12-31')
  })
})

describe('addDays', () => {
  it('adds days to a date', () => {
    expect(addDays('2024-01-15', 3)).toBe('2024-01-18')
  })

  it('handles month boundary', () => {
    expect(addDays('2024-01-30', 3)).toBe('2024-02-02')
  })

  it('handles year boundary', () => {
    expect(addDays('2024-12-30', 5)).toBe('2025-01-04')
  })

  it('handles February in leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-28', 2)).toBe('2024-03-01')
  })

  it('handles February in non-leap year', () => {
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01')
  })

  it('adds zero days correctly', () => {
    expect(addDays('2024-06-15', 0)).toBe('2024-06-15')
  })

  it('adds single day correctly', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02')
  })

  it('parses in local time, not UTC', () => {
    // If parsed as UTC, timezone offset could shift the date
    const result = addDays('2024-01-01', 0)
    expect(result).toBe('2024-01-01')
  })
})

describe('isBeforeOrEqual', () => {
  it('returns true when dateA is before dateB', () => {
    expect(isBeforeOrEqual('2024-01-01', '2024-01-15')).toBe(true)
  })

  it('returns true when dates are equal', () => {
    expect(isBeforeOrEqual('2024-01-15', '2024-01-15')).toBe(true)
  })

  it('returns false when dateA is after dateB', () => {
    expect(isBeforeOrEqual('2024-01-16', '2024-01-15')).toBe(false)
  })

  it('compares across months correctly', () => {
    expect(isBeforeOrEqual('2024-01-31', '2024-02-01')).toBe(true)
  })

  it('compares across years correctly', () => {
    expect(isBeforeOrEqual('2023-12-31', '2024-01-01')).toBe(true)
  })
})

describe('isValidDateString', () => {
  it('returns true for valid date strings', () => {
    expect(isValidDateString('2024-01-15')).toBe(true)
    expect(isValidDateString('2024-12-31')).toBe(true)
    expect(isValidDateString('2024-02-29')).toBe(true) // leap year
  })

  it('returns false for invalid format', () => {
    expect(isValidDateString('2024/01/15')).toBe(false)
    expect(isValidDateString('01-15-2024')).toBe(false)
    expect(isValidDateString('2024-1-15')).toBe(false)
    expect(isValidDateString('not-a-date')).toBe(false)
    expect(isValidDateString('')).toBe(false)
  })

  it('returns false for invalid dates', () => {
    expect(isValidDateString('2024-13-01')).toBe(false) // month 13
    expect(isValidDateString('2024-02-30')).toBe(false) // Feb 30
    expect(isValidDateString('2023-02-29')).toBe(false) // non-leap year
    expect(isValidDateString('2024-00-01')).toBe(false) // month 0
    expect(isValidDateString('2024-01-32')).toBe(false) // day 32
  })
})
