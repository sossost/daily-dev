'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookCheck,
  Layers,
} from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { getUpcomingReviews, getDueByTopic, getScheduleSummary } from '@/lib/srs-schedule'
import { StatCard } from '@/components/stats/StatCard'
import { ReviewTimeline } from '@/components/schedule/ReviewTimeline'
import { TopicDueList } from '@/components/schedule/TopicDueList'

export default function SchedulePage() {
  const isHydrated = useHydration()
  const srsRecords = useProgressStore((s) => s.srsRecords)

  if (!isHydrated) {
    return <ScheduleSkeleton />
  }

  const summary = getScheduleSummary(srsRecords)
  const upcomingReviews = getUpcomingReviews(srsRecords)
  const topicDue = getDueByTopic(srsRecords)

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="홈으로"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">복습 일정</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            간격 반복 학습 현황을 확인하세요
          </p>
        </div>
      </header>

      {summary.totalTracked === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              icon={Clock}
              label="오늘 복습"
              value={summary.dueToday}
              subtext="복습 대기 중"
              index={0}
            />
            <StatCard
              icon={Calendar}
              label="이번 주"
              value={summary.dueThisWeek}
              subtext="7일 내 예정"
              index={1}
            />
            <StatCard
              icon={Layers}
              label="학습 중"
              value={summary.totalTracked}
              subtext="SRS 추적 중"
              index={2}
            />
            <StatCard
              icon={BookCheck}
              label="마스터"
              value={`${summary.masteredPercentage}%`}
              subtext={`${summary.masteredCount}개 숙달`}
              index={3}
            />
          </div>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              14일 복습 타임라인
            </h2>
            <ReviewTimeline reviews={upcomingReviews} />
          </section>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Layers size={16} />
              토픽별 복습 현황
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <TopicDueList topics={topicDue} />
            </div>
          </section>

          {summary.dueToday > 0 && (
            <Link
              href="/session"
              className="block w-full text-center py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              복습 세션 시작하기
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        학습을 시작하면 복습 일정이 표시됩니다
      </p>
      <Link
        href="/session"
        className="inline-block mt-4 text-blue-500 hover:underline text-sm"
      >
        학습 시작하기
      </Link>
    </div>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  )
}
