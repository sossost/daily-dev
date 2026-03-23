'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { ChevronDown, Check, X, ListChecks } from 'lucide-react'
import type { SessionQuestion, SessionAnswer } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { CodeBlock } from '@/components/quiz/CodeBlock'
import { BookmarkButton } from '@/components/quiz/BookmarkButton'

interface AnswerReviewListProps {
  questions: readonly SessionQuestion[]
  answers: readonly SessionAnswer[]
}

type FilterMode = 'all' | 'incorrect' | 'correct'

const ANIMATION_DELAY_STEP = 0.05

export function AnswerReviewList({ questions, answers }: AnswerReviewListProps) {
  const [filter, setFilter] = useState<FilterMode>('all')
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set())

  if (answers.length === 0) {
    return null
  }

  const reviewItems = answers.map((answer) => {
    const sessionQuestion = questions.find(
      (q) => q.question.id === answer.questionId
    )
    return { answer, sessionQuestion }
  }).filter((item): item is { answer: SessionAnswer; sessionQuestion: SessionQuestion } =>
    item.sessionQuestion != null
  )

  const filteredItems = reviewItems.filter((item) => {
    if (filter === 'incorrect') return !item.answer.isCorrect
    if (filter === 'correct') return item.answer.isCorrect
    return true
  })

  const incorrectCount = reviewItems.filter((item) => !item.answer.isCorrect).length
  const correctCount = reviewItems.filter((item) => item.answer.isCorrect).length

  const toggleExpanded = (questionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(filteredItems.map((item) => item.answer.questionId)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  const allExpanded = filteredItems.length > 0 && filteredItems.every(
    (item) => expandedIds.has(item.answer.questionId)
  )

  return (
    <section className="mt-6" aria-label="문제 리뷰">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ListChecks size={18} />
          문제 리뷰
        </h3>
        <button
          onClick={allExpanded ? collapseAll : expandAll}
          className="text-xs text-blue-500 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label={allExpanded ? '모두 접기' : '모두 펼치기'}
        >
          {allExpanded ? '모두 접기' : '모두 펼치기'}
        </button>
      </div>

      <div className="flex gap-2 mb-4" role="radiogroup" aria-label="필터">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`전체 (${reviewItems.length})`}
        />
        <FilterButton
          active={filter === 'incorrect'}
          onClick={() => setFilter('incorrect')}
          label={`오답 (${incorrectCount})`}
        />
        <FilterButton
          active={filter === 'correct'}
          onClick={() => setFilter('correct')}
          label={`정답 (${correctCount})`}
        />
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
          해당하는 문제가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, index) => (
            <ReviewCard
              key={item.answer.questionId}
              sessionQuestion={item.sessionQuestion}
              answer={item.answer}
              isExpanded={expandedIds.has(item.answer.questionId)}
              onToggle={() => toggleExpanded(item.answer.questionId)}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 text-xs font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        active
          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      )}
    >
      {label}
    </button>
  )
}

interface ReviewCardProps {
  sessionQuestion: SessionQuestion
  answer: SessionAnswer
  isExpanded: boolean
  onToggle: () => void
  index: number
}

function ReviewCard({
  sessionQuestion,
  answer,
  isExpanded,
  onToggle,
  index,
}: ReviewCardProps) {
  const { question } = sessionQuestion
  const questionNumber = index + 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * ANIMATION_DELAY_STEP }}
      className={clsx(
        'rounded-xl border overflow-hidden',
        answer.isCorrect
          ? 'border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-800'
          : 'border-red-200 dark:border-red-800/50 bg-white dark:bg-gray-800'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        aria-expanded={isExpanded}
        aria-controls={`review-${question.id}`}
      >
        <span
          className={clsx(
            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
            answer.isCorrect
              ? 'bg-green-100 dark:bg-green-900/50'
              : 'bg-red-100 dark:bg-red-900/50'
          )}
          aria-hidden="true"
        >
          {answer.isCorrect ? (
            <Check size={14} className="text-green-600 dark:text-green-400" />
          ) : (
            <X size={14} className="text-red-600 dark:text-red-400" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            <span className="text-gray-400 dark:text-gray-500 mr-1.5">Q{questionNumber}.</span>
            {question.question}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {TOPIC_LABELS[question.topic]}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={clsx(
            'flex-shrink-0 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`review-${question.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-2">
                {question.question}
              </p>

              {question.code != null && <CodeBlock code={question.code} />}

              <div className="space-y-2 mt-3">
                {question.options.map((option, optionIndex) => {
                  const isCorrectOption = optionIndex === question.correctIndex
                  const isUserSelection = optionIndex === answer.selectedIndex
                  return (
                    <div
                      key={optionIndex}
                      className={clsx(
                        'flex items-start gap-2 p-2.5 rounded-lg text-sm',
                        isCorrectOption && 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800',
                        isUserSelection && !isCorrectOption && 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800',
                        !isCorrectOption && !isUserSelection && 'bg-gray-50 dark:bg-gray-700/50'
                      )}
                    >
                      <span
                        className={clsx(
                          'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5',
                          isCorrectOption && 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
                          isUserSelection && !isCorrectOption && 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
                          !isCorrectOption && !isUserSelection && 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        )}
                      >
                        {optionIndex + 1}
                      </span>
                      <span
                        className={clsx(
                          'flex-1',
                          isCorrectOption && 'text-green-800 dark:text-green-200 font-medium',
                          isUserSelection && !isCorrectOption && 'text-red-800 dark:text-red-200 line-through',
                          !isCorrectOption && !isUserSelection && 'text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {option}
                      </span>
                      {isCorrectOption && (
                        <Check size={14} className="flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                      )}
                      {isUserSelection && !isCorrectOption && (
                        <X size={14} className="flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                  {question.explanation}
                </p>
                <a
                  href={question.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  aria-label="참고 자료 보기 (새 탭에서 열림)"
                >
                  참고 자료 보기
                </a>
              </div>

              <div className="mt-2 flex justify-end">
                <BookmarkButton questionId={question.id} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
