import { loadFromStorage, saveToStorage, clearStorage } from '@/lib/storage'

describe('loadFromStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when key does not exist', () => {
    const result = loadFromStorage('nonexistent')
    expect(result).toBeNull()
  })

  it('returns parsed value when key exists', () => {
    window.localStorage.setItem('test', JSON.stringify({ a: 1 }))
    const result = loadFromStorage<{ a: number }>('test')
    expect(result).toEqual({ a: 1 })
  })

  it('returns null when value is invalid JSON', () => {
    window.localStorage.setItem('test', 'not-json')
    const result = loadFromStorage('test')
    expect(result).toBeNull()
  })
})

describe('saveToStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('saves value to localStorage', () => {
    saveToStorage('test', { a: 1 })
    const raw = window.localStorage.getItem('test')
    expect(raw).toBe(JSON.stringify({ a: 1 }))
  })

  it('handles storage errors gracefully', () => {
    const original = window.localStorage.setItem
    window.localStorage.setItem = () => {
      throw new Error('Storage full')
    }

    expect(() => saveToStorage('test', 'value')).not.toThrow()

    window.localStorage.setItem = original
  })
})

describe('clearStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('removes item from localStorage', () => {
    window.localStorage.setItem('test', 'value')
    clearStorage('test')
    expect(window.localStorage.getItem('test')).toBeNull()
  })

  it('does not throw when key does not exist', () => {
    expect(() => clearStorage('nonexistent')).not.toThrow()
  })
})
