'use client'

import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardPage() {
  const isHydrated = useHydration()
  const topicStats = useProgressStore((s) => s.topicStats)
  const totalSessions = useProgressStore((s) => s.totalSessions)
  const currentStreak = useProgressStore((s) => s.currentStreak)

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
