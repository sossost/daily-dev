'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Difficulty, Question } from '@/types'

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-500 bg-green-50 dark:bg-green-950',
  medium: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  hard: 'text-red-500 bg-red-50 dark:bg-red-950',
}

interface SampleQuestionProps {
  readonly question: Question
}

export function SampleQuestion({ question }: SampleQuestionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const td = useTranslations('topics.detail')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {question.question}
            </p>
            {question.code != null && (
              <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                <code>{question.code}</code>
              </pre>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[question.difficulty]}`}
            >
              {td(question.difficulty)}
            </span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} className="text-gray-400" />
            </motion.span>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex flex-col gap-2 mb-3">
                {question.options.map((option, index) => (
                  <div
                    key={option}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      index === question.correctIndex
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium'
                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
