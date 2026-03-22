'use client'

import { motion } from 'framer-motion'
import type { Difficulty, SessionQuestion } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { CodeBlock } from '@/components/quiz/CodeBlock'
import { OptionList } from '@/components/quiz/OptionList'
import { Explanation } from '@/components/quiz/Explanation'

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
}

interface QuizCardProps {
  sessionQuestion: SessionQuestion
  selectedIndex: number | null
  isAnswered: boolean
  onSelect: (index: number) => void
  onNext: () => void
  isLast: boolean
}

export function QuizCard({
  sessionQuestion,
  selectedIndex,
  isAnswered,
  onSelect,
  onNext,
  isLast,
}: QuizCardProps) {
  const { question, isReview } = sessionQuestion
  const isCorrect = selectedIndex === question.correctIndex

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
          {TOPIC_LABELS[question.topic]}
        </span>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {DIFFICULTY_LABELS[question.difficulty]}
        </span>
        {isReview && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            복습
          </span>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
        {question.question}
      </h2>

      {question.code != null && <CodeBlock code={question.code} />}

      <OptionList
        options={question.options}
        correctIndex={question.correctIndex}
        selectedIndex={selectedIndex}
        isAnswered={isAnswered}
        onSelect={onSelect}
      />

      {isAnswered && (
        <>
          <Explanation
            isCorrect={isCorrect}
            explanation={question.explanation}
            sourceUrl={question.sourceUrl}
          />
          <button
            onClick={onNext}
            className="mt-6 w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            {isLast ? '결과 보기' : '다음 문제'}
          </button>
        </>
      )}
    </motion.div>
  )
}
