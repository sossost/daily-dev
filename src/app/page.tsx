'use client'

import { useProgressStore } from '@/stores/useProgressStore'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardPage() {
  const topicStats = useProgressStore((s) => s.topicStats)
  const totalSessions = useProgressStore((s) => s.totalSessions)
  const currentStreak = useProgressStore((s) => s.currentStreak)

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
