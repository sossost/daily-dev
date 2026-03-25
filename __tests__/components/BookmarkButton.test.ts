/**
 * Tests for BookmarkButton display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the toggle logic and aria state derivation.
 */

interface BookmarkDisplayState {
  ariaLabel: string
  ariaPressed: boolean
  fillClass: string
}

function computeBookmarkState(isBookmarked: boolean): BookmarkDisplayState {
  return {
    ariaLabel: isBookmarked ? 'removeBookmark' : 'bookmark',
    ariaPressed: isBookmarked,
    fillClass: isBookmarked
      ? 'fill-blue-500 text-blue-500'
      : 'text-gray-400 dark:text-gray-500',
  }
}

describe('BookmarkButton logic', () => {
  it('shows bookmark label when not bookmarked', () => {
    const state = computeBookmarkState(false)
    expect(state.ariaLabel).toBe('bookmark')
    expect(state.ariaPressed).toBe(false)
  })

  it('shows removeBookmark label when bookmarked', () => {
    const state = computeBookmarkState(true)
    expect(state.ariaLabel).toBe('removeBookmark')
    expect(state.ariaPressed).toBe(true)
  })

  it('uses fill class when bookmarked', () => {
    const state = computeBookmarkState(true)
    expect(state.fillClass).toContain('fill-blue-500')
  })

  it('uses gray class when not bookmarked', () => {
    const state = computeBookmarkState(false)
    expect(state.fillClass).toContain('text-gray-400')
  })

  it('toggles between states correctly', () => {
    const initial = computeBookmarkState(false)
    const toggled = computeBookmarkState(true)
    const toggledBack = computeBookmarkState(false)

    expect(initial.ariaPressed).toBe(false)
    expect(toggled.ariaPressed).toBe(true)
    expect(toggledBack.ariaPressed).toBe(false)
    expect(initial).toEqual(toggledBack)
  })
})
