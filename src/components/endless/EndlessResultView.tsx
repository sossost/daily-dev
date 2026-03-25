'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Trophy, Target, BarChart3, Home, RotateCcw } from 'lucide-react'
import type { EndlessResult } from '@/lib/endless-session'
import type { Topic } from '@/types'

const ANIMATION_DELAY_STEP = 0.06
const HIGH_ACCURACY = 80
const MEDIUM_ACCURACY = 60
const BAR_MAX_WIDTH_PERCENT = 100

interface EndlessResultViewProps {
  readonly result: EndlessResult
  readonly onRetry: () => void
  readonly onHome: () => void
}

export function EndlessResultView({ result, onRetry, onHome }: EndlessResultViewProps) {
  const t = useTranslations('endless')
  const topicT = useTranslations('topics')

  const grade = result.accuracy >= HIGH_ACCURACY
    ? 'excellent'
    : result.accuracy >= MEDIUM_ACCURACY
      ? 'good'
      : 'keepTrying'

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <Trophy size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {t(grade)}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('sessionComplete')}
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAY_STEP }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center"
        >
          <Target size={18} className="text-blue-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{result.totalAnswered}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('totalAnswered')}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAY_STEP * 2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center"
        >
          <Trophy size={18} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{result.correctCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('correctAnswers')}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAY_STEP * 3 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center"
        >
          <BarChart3 size={18} className="text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{result.accuracy}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('accuracy')}</p>
        </motion.div>
      </div>

      {result.topicBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: ANIMATION_DELAY_STEP * 4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {t('topicBreakdown')}
          </h3>
          <div className="space-y-3">
            {result.topicBreakdown.map((stat) => {
              const pct = stat.total > 0
                ? Math.round((stat.correct / stat.total) * BAR_MAX_WIDTH_PERCENT)
                : 0
              return (
                <div key={stat.topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {topicT(String(stat.topic))}
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {stat.correct}/{stat.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        pct >= HIGH_ACCURACY
                          ? 'bg-emerald-500'
                          : pct >= MEDIUM_ACCURACY
                            ? 'bg-yellow-500'
                            : 'bg-red-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
          aria-label={t('retryEndless')}
        >
          <RotateCcw size={16} />
          {t('retryEndless')}
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={t('backHome')}
        >
          <Home size={16} />
          {t('backHome')}
        </button>
      </div>
    </div>
  )
}
