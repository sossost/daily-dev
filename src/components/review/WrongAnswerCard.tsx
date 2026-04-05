'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { WrongAnswerEntry } from '@/lib/wrong-answers'
import { BookmarkButton } from '@/components/quiz/BookmarkButton'
import { CodeBlock } from '@/components/quiz/CodeBlock'

interface WrongAnswerCardProps {
  readonly entry: WrongAnswerEntry
}

export function WrongAnswerCard({ entry }: WrongAnswerCardProps) {
  const t = useTranslations('wrongAnswers')
  const topicT = useTranslations('topics')
  const quizT = useTranslations('quiz')
  const [isExpanded, setIsExpanded] = useState(false)
  const { question, wrongCount } = entry

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex-1 min-w-0 text-left"
          aria-expanded={isExpanded}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
            {question.question}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
              {t('wrongCount', { count: wrongCount })}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {topicT(question.topic)}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <BookmarkButton questionId={question.id} />
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
            )}
          </button>
        </div>
      </div>

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
              {question.code != null && <CodeBlock code={question.code} />}

              <div className="space-y-1.5">
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      idx === question.correctIndex
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {question.explanation}
              </p>

              <a
                href={question.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={quizT('viewSourceNewTab')}
                className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {quizT('viewSource')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
