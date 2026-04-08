'use client'

import { BarChart3, Bookmark, CalendarClock, Dumbbell, History, Target, Timer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useProgressStore } from '@/stores/useProgressStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import { SessionStartCard } from '@/components/dashboard/SessionStartCard'
import { SettingsDropdown } from '@/components/SettingsDropdown'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Link } from '@/i18n/navigation'

export default function DashboardPage() {
  const t = useTranslations()
  const totalSessions = useProgressStore((s) => s.sessions.length)
  const currentStreak = useProgressStore((s) => s.currentStreak)
  const bookmarkCount = useBookmarkStore((s) => s.bookmarkedIds.length)

  const isHydrated = useHydration()
  const isOnboardingComplete = useTopicFilterStore((s) => s.isOnboardingComplete)
  const completeOnboarding = useTopicFilterStore((s) => s.completeOnboarding)

  const showOnboarding = isHydrated && isOnboardingComplete === false

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3 mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">DailyDev</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('metadata.tagline')}
          </p>
        </div>
        <SettingsDropdown />
      </header>

      <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />

      <DashboardContent
        totalSessions={totalSessions}
        currentStreak={currentStreak}
        bookmarkCount={bookmarkCount}
      />
    </div>
  )
}

interface DashboardContentProps {
  totalSessions: number
  currentStreak: number
  bookmarkCount: number
}

function DashboardContent({
  totalSessions,
  currentStreak,
  bookmarkCount,
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

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('sectionStudy')}</p>
        <div className="flex flex-col gap-2">
          <Link
            href="/practice"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            <Dumbbell size={18} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('practice')}
            </span>
          </Link>
          <Link
            href="/review"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            <Target size={18} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('review')}
            </span>
          </Link>
          <Link
            href="/challenge"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            <Timer size={18} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('challenge')}
            </span>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('sectionRecord')}</p>
        <div className="flex flex-col gap-2">
          <Link
            href="/history"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
          >
            <History size={18} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('history')}
            </span>
            {totalSessions > 0 && (
              <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                {totalSessions} {tc('sessions')}
              </span>
            )}
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
        </div>
      </div>

    </>
  )
}
