'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Filter } from 'lucide-react'
import { TOPICS } from '@/types'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { TopicFilterModal } from '@/components/dashboard/TopicFilterModal'

export function SessionStartCard() {
  const t = useTranslations('session')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const enabledCount = useTopicFilterStore((s) => s.enabledTopics.length)
  const isFiltered = enabledCount < TOPICS.length

  return (
    <>
      <div className="flex gap-2">
        <Link
          href="/session"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <h2 className="text-xl font-bold mb-1">{t('start')}</h2>
          <p className="text-sm text-blue-100">
            {isFiltered
              ? t('topicsCount', { count: enabledCount, total: TOPICS.length })
              : t('startDescription')}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`flex flex-col items-center justify-center w-16 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isFiltered
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label={t('filterSettings')}
        >
          <Filter size={20} />
          <span className="text-[10px] font-medium mt-1">{t('filter')}</span>
        </button>
      </div>
      <TopicFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  )
}
