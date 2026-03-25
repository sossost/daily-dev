'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface ResultSummaryProps {
  correct: number
  incorrect: number
  total: number
}

export function ResultSummary({ correct, incorrect, total }: ResultSummaryProps) {
  const t = useTranslations('result')
  const PERCENTAGE_MULTIPLIER = 100
  const FULL_CIRCUMFERENCE = 251.2
  const scorePercentage = total > 0
    ? Math.round((correct / total) * PERCENTAGE_MULTIPLIER)
    : 0
  const strokeDashoffset = FULL_CIRCUMFERENCE - (FULL_CIRCUMFERENCE * scorePercentage) / PERCENTAGE_MULTIPLIER

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('title')}</h2>

      <div className="relative w-40 h-40 mx-auto mb-6" aria-label={t('accuracyLabel', { percent: scorePercentage })}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label={t('accuracyChart', { percent: scorePercentage })}>
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke={scorePercentage >= 70 ? '#22c55e' : '#f59e0b'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={FULL_CIRCUMFERENCE}
            initial={{ strokeDashoffset: FULL_CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {scorePercentage}%
          </motion.span>
        </div>
      </div>

      <div className="flex justify-center gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correct}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('correct')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">{incorrect}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('incorrect')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('total')}</p>
        </div>
      </div>
    </div>
  )
}
