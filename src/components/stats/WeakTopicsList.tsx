'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import type { WeakTopic } from '@/lib/stats'

const ANIMATION_DELAY_STEP = 0.08

interface WeakTopicsListProps {
  readonly weakTopics: readonly WeakTopic[]
}

export function WeakTopicsList({ weakTopics }: WeakTopicsListProps) {
  const t = useTranslations('stats')
  const topicT = useTranslations('topics')

  if (weakTopics.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle size={16} />
        <span>{t('allTopicsGood')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {weakTopics.map((topic, i) => (
        <motion.div
          key={topic.topic}
          className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * ANIMATION_DELAY_STEP }}
        >
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {topicT(topic.topic)}
            </span>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {t('questionsSolved', { count: topic.totalAnswered })}
            </span>
          </div>
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {topic.accuracy}%
          </span>
        </motion.div>
      ))}
    </div>
  )
}
