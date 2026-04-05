'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'

export default function TopicsPage() {
  const t = useTranslations('topics')
  const tc = useTranslations('common')
  const topicStats = useProgressStore((s) => s.topicStats)

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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
      </header>
      <TopicProgressList topicStats={topicStats} />
    </div>
  )
}
