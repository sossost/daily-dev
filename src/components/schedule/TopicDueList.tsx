'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { TopicReviewCount } from '@/lib/srs-schedule'

const ANIMATION_DELAY_STEP = 0.05

interface TopicDueListProps {
  readonly topics: readonly TopicReviewCount[]
}

export function TopicDueList({ topics }: TopicDueListProps) {
  const t = useTranslations('schedule')
  const topicT = useTranslations('topics')

  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        {t('topicEmptyState')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {topics.map((entry, i) => (
        <motion.div
          key={entry.topic}
          className="flex items-center gap-3 py-2"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * ANIMATION_DELAY_STEP }}
        >
          <span className="text-xs text-gray-600 dark:text-gray-400 w-24 shrink-0 truncate text-right">
            {topicT(entry.topic)}
          </span>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${entry.dueCount > 0 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${entry.totalCount > 0 ? (entry.dueCount / entry.totalCount) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, delay: i * ANIMATION_DELAY_STEP }}
              />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 w-12 text-right shrink-0">
              {entry.dueCount}/{entry.totalCount}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
