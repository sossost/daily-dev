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
    <div className="flex flex-col gap-3 mt-4">
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
              'flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-colors',
              {
                'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer':
                  !isAnswered,
                'border-green-500 bg-green-50': showCorrect,
                'border-red-500 bg-red-50': showIncorrect,
                'border-gray-200 opacity-60':
                  isAnswered && !isCorrect && !isSelected,
                'cursor-not-allowed': isAnswered,
              },
            )}
          >
            <span
              className={clsx(
                'flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0',
                {
                  'bg-gray-100 text-gray-600': !isAnswered,
                  'bg-green-500 text-white': showCorrect,
                  'bg-red-500 text-white': showIncorrect,
                  'bg-gray-100 text-gray-400':
                    isAnswered && !isCorrect && !isSelected,
                },
              )}
            >
              {OPTION_LABELS[index]}
            </span>
            <span className="text-sm leading-relaxed pt-0.5">{option}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
