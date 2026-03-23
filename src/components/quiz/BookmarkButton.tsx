'use client'

import { motion } from 'framer-motion'
import { Bookmark } from 'lucide-react'
import { useBookmarkStore } from '@/stores/useBookmarkStore'

interface BookmarkButtonProps {
  questionId: string
}

export function BookmarkButton({ questionId }: BookmarkButtonProps) {
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark)
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(questionId))

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => toggleBookmark(questionId)}
      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
      aria-pressed={isBookmarked}
    >
      <Bookmark
        size={18}
        className={
          isBookmarked
            ? 'fill-blue-500 text-blue-500'
            : 'text-gray-400 dark:text-gray-500'
        }
      />
    </motion.button>
  )
}
