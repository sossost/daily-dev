'use client'

import { BarChart3, Bookmark, CalendarClock, Dumbbell, FileX2, History, Target, Timer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useProgressStore } from '@/stores/useProgressStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'
import { SettingsDropdown } from '@/components/SettingsDropdown'
import { Link } from '@/i18n/navigation'

export default function DashboardPage() {
  const t = useTranslations()
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
            {t('metadata.tagline')}
          </p>
        </div>
        <SettingsDropdown />
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
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  return (
    <>
      <SessionStartCard />

      <div className="flex gap-4 my-6">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSessions}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('totalSessions')}</p>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentStreak}<span className="text-sm font-medium ml-0.5">{tc('days')}</span></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('streak')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <Link
          href="/history"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <History size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('history')}
          </span>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {totalSessions > 0 ? `${totalSessions} ${tc('sessions')}` : ''}
          </span>
        </Link>
        <Link
          href="/stats"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <BarChart3 size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('stats')}
          </span>
        </Link>
        <Link
          href="/schedule"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <CalendarClock size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('schedule')}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {t('srsSchedule')}
          </span>
        </Link>
        <Link
          href="/bookmarks"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <Bookmark size={18} className="text-blue-500 fill-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('bookmarks')}
          </span>
          {bookmarkCount > 0 && (
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {tc('items', { count: bookmarkCount })}
            </span>
          )}
        </Link>
        <Link
          href="/practice"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
        >
          <Dumbbell size={18} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('practice')}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {t('topicDifficulty')}
          </span>
        </Link>
        <Link
          href="/focus"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
        >
          <Target size={18} className="text-orange-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('focusPractice')}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {t('weaknessAnalysis')}
          </span>
        </Link>
        <Link
          href="/wrong-answers"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-colors"
        >
          <FileX2 size={18} className="text-red-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('wrongAnswers')}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {t('wrongAnswersDesc')}
          </span>
        </Link>
        <Link
          href="/challenge"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
        >
          <Timer size={18} className="text-purple-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('challenge')}
          </span>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {t('challengeDesc')}
          </span>
        </Link>
      </div>

      <TopicProgressList topicStats={topicStats} />
    </>
  )
}
