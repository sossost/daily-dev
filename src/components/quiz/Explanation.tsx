'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ExplanationProps {
  isCorrect: boolean
  explanation: string
  sourceUrl: string
}

export function Explanation({ isCorrect, explanation, sourceUrl }: ExplanationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx('mt-6 p-4 rounded-lg border', {
        'bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-400/50': isCorrect,
        'bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-400/50': !isCorrect,
      })}
    >
      <p
        className={clsx('text-sm font-semibold mb-2', {
          'text-green-700 dark:text-green-300': isCorrect,
          'text-red-700 dark:text-red-300': !isCorrect,
        })}
      >
        {isCorrect ? '정답입니다!' : '오답입니다'}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{explanation}</p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="참고 자료 보기 (새 탭에서 열림)"
        className="inline-block mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        참고 자료 보기
      </a>
    </motion.div>
  )
}
