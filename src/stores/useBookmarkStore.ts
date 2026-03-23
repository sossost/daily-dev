/**
 * Bookmark store — tracks bookmarked question IDs.
 * Persisted to localStorage so bookmarks survive across sessions.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookmarkState {
  bookmarkedIds: readonly string[]
  toggleBookmark: (questionId: string) => void
  isBookmarked: (questionId: string) => boolean
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarkedIds: [] as readonly string[],

      toggleBookmark: (questionId) => {
        const { bookmarkedIds } = get()
        const exists = bookmarkedIds.includes(questionId)
        set({
          bookmarkedIds: exists
            ? bookmarkedIds.filter((id) => id !== questionId)
            : [...bookmarkedIds, questionId],
        })
      },

      isBookmarked: (questionId) => {
        return get().bookmarkedIds.includes(questionId)
      },
    }),
    {
      name: 'daily-dev-bookmarks',
    },
  ),
)
