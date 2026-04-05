'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, History } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { SessionHistoryCard } from '@/components/history/SessionHistoryCard'

export default function HistoryPage() {
  const t = useTranslations('history')
  const tc = useTranslations('common')
  const isHydrated = useHydration()
  const sessions = useProgressStore((s) => s.sessions)

  if (isHydrated === false) {
    return <HistorySkeleton />
  }

  const sortedSessions = [...sessions].reverse()

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
            {sortedSessions.length > 0
              ? t('totalSessions', { count: sortedSessions.length })
              : t('empty')}
          </p>
        </div>
      </header>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-16">
          <History size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('emptyDescription')}
          </p>
          <Link
            href="/session"
            className="inline-block mt-4 text-blue-500 hover:underline text-sm"
          >
            {t('startLearning')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session, index) => (
            <SessionHistoryCard
              key={session.id}
              session={session}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
