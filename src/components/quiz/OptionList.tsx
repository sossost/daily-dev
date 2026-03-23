'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

interface OptionListProps {
  options: [string, string, string, string]
  correctIndex: number
  selectedIndex: number | null
  isAnswered: boolean
  onSelect: (index: number) => void
}

export function OptionList({
  options,
  correctIndex,
  selectedIndex,
  isAnswered,
  onSelect,
}: OptionListProps) {
  return (
    <div className="flex flex-col gap-3 mt-4" role="group" aria-label="답변 선택지">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index
        const isCorrect = index === correctIndex
        const showCorrect = isAnswered && isCorrect
        const showIncorrect = isAnswered && isSelected && !isCorrect

        return (
          <motion.button
            key={index}
            whileTap={isAnswered ? undefined : { scale: 0.98 }}
            onClick={() => onSelect(index)}
            disabled={isAnswered}
            className={clsx(
              'flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
              {
                'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer':
                  !isAnswered,
                'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/40': showCorrect,
                'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/40': showIncorrect,
                'border-gray-200 dark:border-gray-700 opacity-60':
                  isAnswered && !isCorrect && !isSelected,
                'cursor-not-allowed': isAnswered,
              },
            )}
          >
            <span
              className={clsx(
                'flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0',
                {
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300': !isAnswered,
                  'bg-green-500 text-white': showCorrect,
                  'bg-red-500 text-white': showIncorrect,
                  'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500':
                    isAnswered && !isCorrect && !isSelected,
                },
              )}
            >
              {OPTION_LABELS[index]}
            </span>
            <span className="text-sm leading-relaxed pt-0.5 text-gray-900 dark:text-gray-100">{option}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
