'use client'

import { motion } from 'framer-motion'

interface ResultSummaryProps {
  correct: number
  incorrect: number
  total: number
}

export function ResultSummary({ correct, incorrect, total }: ResultSummaryProps) {
  const PERCENTAGE_MULTIPLIER = 100
  const FULL_CIRCUMFERENCE = 251.2
  const scorePercentage = total > 0
    ? Math.round((correct / total) * PERCENTAGE_MULTIPLIER)
    : 0
  const strokeDashoffset = FULL_CIRCUMFERENCE - (FULL_CIRCUMFERENCE * scorePercentage) / PERCENTAGE_MULTIPLIER

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-6">학습 결과</h2>

      <div className="relative w-40 h-40 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#e5e7eb"
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
            className="text-3xl font-bold text-gray-900"
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
          <p className="text-2xl font-bold text-green-600">{correct}</p>
          <p className="text-sm text-gray-500">정답</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">{incorrect}</p>
          <p className="text-sm text-gray-500">오답</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-sm text-gray-500">전체</p>
        </div>
      </div>
    </div>
  )
}
