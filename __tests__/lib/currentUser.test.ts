import { setCurrentUser, getCurrentUserId, getIsAuthenticated } from '@/lib/supabase/currentUser'

describe('currentUser', () => {
  beforeEach(() => {
    setCurrentUser(null, false)
  })

  it('returns null userId by default', () => {
    expect(getCurrentUserId()).toBeNull()
  })

  it('returns false for authenticated by default', () => {
    expect(getIsAuthenticated()).toBe(false)
  })

  it('stores userId after setCurrentUser', () => {
    setCurrentUser('user-123', true)
    expect(getCurrentUserId()).toBe('user-123')
  })

  it('stores authenticated state after setCurrentUser', () => {
    setCurrentUser('user-123', true)
    expect(getIsAuthenticated()).toBe(true)
  })

  it('clears userId when set to null', () => {
    setCurrentUser('user-123', true)
    setCurrentUser(null, false)
    expect(getCurrentUserId()).toBeNull()
    expect(getIsAuthenticated()).toBe(false)
  })

  it('handles anonymous user with id but not authenticated', () => {
    setCurrentUser('anon-456', false)
    expect(getCurrentUserId()).toBe('anon-456')
    expect(getIsAuthenticated()).toBe(false)
  })
})
