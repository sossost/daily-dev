/**
 * Bookmark store — tracks bookmarked question IDs.
 * No localStorage persist — data is loaded from Supabase via server injection.
 */
import { create } from 'zustand'
import { getCurrentUserId } from '@/lib/supabase/currentUser'
import { syncBookmark } from '@/lib/supabase/syncBookmark'

interface BookmarkState {
  bookmarkedIds: readonly string[]
  toggleBookmark: (questionId: string) => void
  isBookmarked: (questionId: string) => boolean
  reset: () => void
}

export const useBookmarkStore = create<BookmarkState>()((set, get) => ({
  bookmarkedIds: [] as readonly string[],

  toggleBookmark: (questionId) => {
    const { bookmarkedIds } = get()
    const exists = bookmarkedIds.includes(questionId)
    const updated = exists
      ? bookmarkedIds.filter((id) => id !== questionId)
      : [...bookmarkedIds, questionId]
    set({ bookmarkedIds: updated })

    const userId = getCurrentUserId()
    if (userId != null) {
      syncBookmark(questionId, !exists).catch(() => {
        // Sync failed — bookmark persists in Zustand
      })
    }
  },

  isBookmarked: (questionId) => {
    return get().bookmarkedIds.includes(questionId)
  },

  reset: () => {
    set({ bookmarkedIds: [] })
  },
}))
