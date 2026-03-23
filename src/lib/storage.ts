/** Generic localStorage wrapper with SSR safety and JSON serialization. */

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) {
      return null
    }
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function clearStorage(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage unavailable — silently fail
  }
}
