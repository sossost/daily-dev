'use client'

import Link from 'next/link'
import { BarChart3, Bookmark, CalendarClock, Dumbbell, History } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthButton } from '@/components/AuthButton'
import { SITE_TAGLINE } from '@/lib/constants'

export default function DashboardPage() {
  const topicStats = useProgressStore((s) => s.topicStats)
  const totalSessions = useProgressStore((s) => s.sessions.length)
  const currentStreak = useProgressStore((s) => s.currentStreak)
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkedIds.length)

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">DailyDev</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {SITE_TAGLINE}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </header>

      <DashboardContent
        totalSessions={totalSessions}
        currentStreak={currentStreak}
        bookmarkCount={bookmarkCount}
        topicStats={topicStats}
      />
    </div>
  )
}

interface DashboardContentProps {
  totalSessions: number
  currentStreak: number
  bookmarkCount: number
  topicStats: ReturnType<typeof useProgressStore.getState>['topicStats']
}

function DashboardContent({
  totalSessions,
  currentStreak,
  bookmarkCount,
  topicStats,
}: DashboardContentProps) {
  return (
    <>
      <SessionStartCard />

      <div className="flex gap-4 my-6">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSessions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">총 세션</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStreak}<span className="text-sm font-medium ml-0.5">일</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">연속 학습</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <Link
          href="/history"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <History size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            학습 기록
          </span>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {totalSessions > 0 ? `${totalSessions}개 세션` : ''}
          </span>
        </Link>
        <Link
          href="/stats"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <BarChart3 size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            학습 통계
          </span>
        </Link>
        <Link
          href="/schedule"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <CalendarClock size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            복습 일정
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            SRS 스케줄
          </span>
        </Link>
        <Link
          href="/bookmarks"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <Bookmark size={18} className="text-blue-500 fill-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            북마크
          </span>
          {bookmarkCount > 0 && (
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {bookmarkCount}개
            </span>
          )}
        </Link>
        <Link
          href="/practice"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <Dumbbell size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            연습 모드
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            토픽 · 난이도 선택
          </span>
        </Link>
      </div>

      <TopicProgressList topicStats={topicStats} />
    </>
  )
}

