'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookCheck,
  Layers,
} from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import { getUpcomingReviews, getDueByTopic, getScheduleSummary } from '@/lib/srs-schedule'
import { createTopicFilter } from '@/lib/topics'
import { StatCard } from '@/components/stats/StatCard'
import { ReviewTimeline } from '@/components/schedule/ReviewTimeline'
import { TopicDueList } from '@/components/schedule/TopicDueList'

export default function SchedulePage() {
  const t = useTranslations('schedule')
  const tc = useTranslations('common')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const topicFilter = createTopicFilter(enabledTopics)

  if (isHydrated === false) {
    return <ScheduleSkeleton />
  }

  const summary = getScheduleSummary(srsRecords, topicFilter)
  const upcomingReviews = getUpcomingReviews(srsRecords, locale, topicFilter)
  const topicDue = getDueByTopic(srsRecords, locale, topicFilter)

  return (
    <div>
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={tc('home')}
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('subtitle')}
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
              label={t('todayReview')}
              value={summary.dueToday}
              subtext={t('reviewWaiting')}
              index={0}
            />
            <StatCard
              icon={Calendar}
              label={t('thisWeek')}
              value={summary.dueThisWeek}
              subtext={t('within7days')}
              index={1}
            />
            <StatCard
              icon={Layers}
              label={t('learning')}
              value={summary.totalTracked}
              subtext={t('srsTracking')}
              index={2}
            />
            <StatCard
              icon={BookCheck}
              label={t('mastered')}
              value={`${summary.masteredPercentage}%`}
              subtext={t('masteredCount', { count: summary.masteredCount })}
              index={3}
            />
          </div>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              {t('timeline')}
            </h2>
            <ReviewTimeline reviews={upcomingReviews} />
          </section>

          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Layers size={16} />
              {t('topicStatus')}
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
              {t('startReview')}
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  const t = useTranslations('schedule')
  const ts = useTranslations('session')
  return (
    <div className="text-center py-16">
      <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {t('emptyState')}
      </p>
      <Link
        href="/session"
        className="inline-block mt-4 text-blue-500 hover:underline text-sm"
      >
        {ts('start')}
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
