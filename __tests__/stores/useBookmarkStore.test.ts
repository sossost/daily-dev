import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { act } from '@testing-library/react'

describe('useBookmarkStore', () => {
  beforeEach(() => {
    act(() => {
      const state = useBookmarkStore.getState()
      // Reset to empty bookmarks
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
})
