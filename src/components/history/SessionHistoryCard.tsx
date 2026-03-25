'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { SessionRecord } from '@/types'
import { formatDuration, formatSessionDate, getTopicBreakdown } from '@/lib/session-history'

const PERCENTAGE_MULTIPLIER = 100

interface SessionHistoryCardProps {
  session: SessionRecord
  index: number
}

export function SessionHistoryCard({ session, index }: SessionHistoryCardProps) {
  const t = useTranslations('history')
  const topicT = useTranslations('topics')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const [isExpanded, setIsExpanded] = useState(false)

  const percentage = session.totalQuestions > 0
    ? Math.round((session.score / session.totalQuestions) * PERCENTAGE_MULTIPLIER)
    : 0

  const HIGH_SCORE_THRESHOLD = 70
  const scoreColor = percentage >= HIGH_SCORE_THRESHOLD
    ? 'text-green-600 dark:text-green-400'
    : 'text-amber-600 dark:text-amber-400'

  const topicBreakdown = getTopicBreakdown(session.answers)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full text-left p-4 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded-xl"
        aria-expanded={isExpanded}
        aria-label={t('sessionLabel', { date: formatSessionDate(session.date, locale), percent: percentage })}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatSessionDate(session.date, locale)}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle size={12} className="text-green-500" />
              {session.score}/{session.totalQuestions}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock size={12} />
              {formatDuration(session.duration, locale)}
            </span>
          </div>
        </div>

        <span className={`text-lg font-bold ${scoreColor}`}>
          {percentage}%
        </span>

        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('topicResults')}
                </p>
                {topicBreakdown.map(({ topic, correct, total }) => (
                  <div
                    key={topic}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {topicT(topic)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-green-600 dark:text-green-400 font-medium">{correct}</span>
                      <span className="text-gray-400 dark:text-gray-500">/</span>
                      <span className="text-gray-600 dark:text-gray-400">{total}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-500" />
                    {t('correct')} {session.score}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle size={12} className="text-red-400" />
                    {t('incorrect')} {session.totalQuestions - session.score}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
