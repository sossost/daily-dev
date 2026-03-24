'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
  Trophy,
  BarChart3,
} from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { getAccuracyTrend, getWeakTopics, getOverallAccuracy, getAttemptedTopicCount, getBestAndWorstTopics } from '@/lib/stats'
import { AccuracyTrendChart } from '@/components/stats/AccuracyTrendChart'
import { WeakTopicsList } from '@/components/stats/WeakTopicsList'
import { StatCard } from '@/components/stats/StatCard'
import { TopicAccuracyBars } from '@/components/stats/TopicAccuracyBars'
import { ShareProgressButton } from '@/components/stats/ShareProgressButton'

export default function StatsPage() {
  const isHydrated = useHydration()
  const totalSessions = useProgressStore((s) => s.totalSessions)
  const totalCorrect = useProgressStore((s) => s.totalCorrect)
  const totalAnswered = useProgressStore((s) => s.totalAnswered)
  const currentStreak = useProgressStore((s) => s.currentStreak)
  const longestStreak = useProgressStore((s) => s.longestStreak)
  const topicStats = useProgressStore((s) => s.topicStats)
  const sessions = useProgressStore((s) => s.sessions)

  if (!isHydrated) {
    return <StatsSkeleton />
  }

  const overallAccuracy = getOverallAccuracy(totalCorrect, totalAnswered)
  const trend = getAccuracyTrend(sessions)
  const weakTopics = getWeakTopics(topicStats)
  const attemptedTopics = getAttemptedTopicCount(topicStats)
  const { best, worst } = getBestAndWorstTopics(topicStats)

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">학습 통계</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            나의 학습 성과를 확인하세요
          </p>
        </div>
        {totalSessions > 0 && (
          <ShareProgressButton
            overallAccuracy={overallAccuracy}
            totalSessions={totalSessions}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            totalAnswered={totalAnswered}
            topicStats={topicStats}
          />
        )}
      </header>

      {totalSessions === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              icon={Target}
              label="전체 정답률"
              value={`${overallAccuracy}%`}
              subtext={`${totalCorrect}/${totalAnswered} 정답`}
              index={0}
            />
            <StatCard
              icon={Zap}
              label="현재 연속"
              value={`${currentStreak}일`}
              subtext={`최장 ${longestStreak}일`}
              index={1}
            />
            <StatCard
              icon={BookOpen}
              label="완료 세션"
              value={totalSessions}
              index={2}
            />
            <StatCard
              icon={TrendingUp}
              label="학습 토픽"
              value={`${attemptedTopics}/12`}
              index={3}
            />
          </div>

          {best != null && worst != null && best.topic !== worst.topic && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Trophy size={12} className="text-emerald-500" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">최고 토픽</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{best.label}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{best.accuracy}%</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} className="text-amber-500" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">보강 필요</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{worst.label}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{worst.accuracy}%</p>
              </div>
            </div>
          )}

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <BarChart3 size={16} />
              정답률 추이
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <AccuracyTrendChart trend={trend} />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              토픽별 정답률
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <TopicAccuracyBars topicStats={topicStats} />
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              보강이 필요한 토픽
            </h2>
            <WeakTopicsList weakTopics={weakTopics} />
          </section>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <BarChart3 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        학습을 시작하면 통계가 표시됩니다
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

function StatsSkeleton() {
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
