/**
 * Get today's date as YYYY-MM-DD string in local time.
 */
export function getToday(): string {
  const now = new Date()
  return formatDate(now)
}

/**
 * Format a Date object as YYYY-MM-DD string in local time.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Add days to a YYYY-MM-DD date string. Parses in local time, not UTC.
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

/**
 * Check if dateA is before or equal to dateB (both YYYY-MM-DD strings).
 */
export function isBeforeOrEqual(dateA: string, dateB: string): boolean {
  return dateA <= dateB
}

/**
 * Validate that a string is in YYYY-MM-DD format and represents a real date.
 */
export function isValidDateString(value: string): boolean {
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
  if (!DATE_PATTERN.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}
