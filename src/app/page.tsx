'use client'

import { useEffect } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'

export default function DashboardPage() {
  const completedToday = useProgressStore((s) => s.completedToday)
  const topicStats = useProgressStore((s) => s.topicStats)
  const totalSessions = useProgressStore((s) => s.totalSessions)
  const currentStreak = useProgressStore((s) => s.currentStreak)
  const refreshDailyState = useProgressStore((s) => s.refreshDailyState)

  useEffect(() => {
    refreshDailyState()
  }, [refreshDailyState])

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">DailyDev</h1>
        <p className="text-sm text-gray-500 mt-1">
          매일 5분, JavaScript 핵심 개념 학습
        </p>
      </header>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          <p className="text-xs text-gray-500 mt-1">총 세션</p>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{currentStreak}</p>
          <p className="text-xs text-gray-500 mt-1">연속 학습</p>
        </div>
      </div>

      <SessionStartCard completedToday={completedToday} />
      <TopicProgressList topicStats={topicStats} />
    </div>
  )
}
