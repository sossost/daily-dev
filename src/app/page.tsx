'use client'

import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useHydration } from '@/hooks/useHydration'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardPage() {
  const isHydrated = useHydration()
  const topicStats = useProgressStore((s) => s.topicStats)
  const totalSessions = useProgressStore((s) => s.totalSessions)
  const currentStreak = useProgressStore((s) => s.currentStreak)
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkedIds.length)

  if (!isHydrated) {
    return <DashboardSkeleton />
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">DailyDev</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            매일 5분, JavaScript 핵심 개념 학습
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSessions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">총 세션</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStreak}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">연속 학습</p>
        </div>
      </div>

      {bookmarkCount > 0 && (
        <Link
          href="/bookmarks"
          className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <Bookmark size={18} className="text-blue-500 fill-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            북마크
          </span>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {bookmarkCount}개
          </span>
        </Link>
      )}

      <SessionStartCard />
      <TopicProgressList topicStats={topicStats} />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        </div>
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
