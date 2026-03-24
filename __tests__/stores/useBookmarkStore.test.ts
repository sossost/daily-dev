import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { act } from '@testing-library/react'

// Mock supabase modules to prevent real calls and test sync paths
jest.mock('@/lib/supabase/currentUser', () => ({
  getCurrentUserId: jest.fn(() => null),
}))
jest.mock('@/lib/supabase/syncBookmark', () => ({
  syncBookmark: jest.fn(() => Promise.resolve()),
}))

import { getCurrentUserId } from '@/lib/supabase/currentUser'
import { syncBookmark } from '@/lib/supabase/syncBookmark'

const mockGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>
const mockSyncBookmark = syncBookmark as jest.MockedFunction<typeof syncBookmark>

describe('useBookmarkStore', () => {
  beforeEach(() => {
    mockGetCurrentUserId.mockReturnValue(null)
    mockSyncBookmark.mockClear()
    act(() => {
      useBookmarkStore.setState({ bookmarkedIds: [] })
    })
  })

  it('starts with no bookmarks', () => {
    const { bookmarkedIds } = useBookmarkStore.getState()
    expect(bookmarkedIds).toEqual([])
  })

  it('adds a bookmark when toggling a non-bookmarked question', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    const { bookmarkedIds } = useBookmarkStore.getState()
    expect(bookmarkedIds).toContain('scope-001')
  })

  it('removes a bookmark when toggling a bookmarked question', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    const { bookmarkedIds } = useBookmarkStore.getState()
    expect(bookmarkedIds).not.toContain('scope-001')
  })

  it('tracks multiple bookmarks independently', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    act(() => {
      useBookmarkStore.getState().toggleBookmark('closure-002')
    })
    const { bookmarkedIds } = useBookmarkStore.getState()
    expect(bookmarkedIds).toEqual(['scope-001', 'closure-002'])
  })

  it('isBookmarked returns correct state', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    expect(useBookmarkStore.getState().isBookmarked('scope-001')).toBe(true)
    expect(useBookmarkStore.getState().isBookmarked('scope-002')).toBe(false)
  })

  it('removing one bookmark does not affect others', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    act(() => {
      useBookmarkStore.getState().toggleBookmark('closure-002')
    })
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    const { bookmarkedIds } = useBookmarkStore.getState()
    expect(bookmarkedIds).toEqual(['closure-002'])
  })

  it('reset clears all bookmarks', () => {
    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
      useBookmarkStore.getState().toggleBookmark('closure-002')
    })
    expect(useBookmarkStore.getState().bookmarkedIds).toHaveLength(2)

    act(() => {
      useBookmarkStore.getState().reset()
    })
    expect(useBookmarkStore.getState().bookmarkedIds).toEqual([])
  })

  it('calls syncBookmark when user is authenticated and adding', () => {
    mockGetCurrentUserId.mockReturnValue('user-123')

    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })

    expect(mockSyncBookmark).toHaveBeenCalledWith('scope-001', true)
  })

  it('calls syncBookmark with false when user is authenticated and removing', () => {
    mockGetCurrentUserId.mockReturnValue('user-123')

    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })
    mockSyncBookmark.mockClear()

    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })

    expect(mockSyncBookmark).toHaveBeenCalledWith('scope-001', false)
  })

  it('does not call syncBookmark when user is not authenticated', () => {
    mockGetCurrentUserId.mockReturnValue(null)

    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })

    expect(mockSyncBookmark).not.toHaveBeenCalled()
  })

  it('handles syncBookmark failure gracefully', () => {
    mockGetCurrentUserId.mockReturnValue('user-123')
    mockSyncBookmark.mockRejectedValue(new Error('Network error'))

    act(() => {
      useBookmarkStore.getState().toggleBookmark('scope-001')
    })

    // Bookmark should still be toggled in local state
    expect(useBookmarkStore.getState().isBookmarked('scope-001')).toBe(true)
  })
})
