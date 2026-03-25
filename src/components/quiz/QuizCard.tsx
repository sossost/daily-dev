'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { Difficulty, SessionQuestion } from '@/types'
import { CodeBlock } from '@/components/quiz/CodeBlock'
import { OptionList } from '@/components/quiz/OptionList'
import { Explanation } from '@/components/quiz/Explanation'
import { BookmarkButton } from '@/components/quiz/BookmarkButton'

const DIFFICULTY_KEYS: Record<Difficulty, 'easy' | 'medium' | 'hard'> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
}

interface QuizCardProps {
  sessionQuestion: SessionQuestion
  selectedIndex: number | null
  isAnswered: boolean
  onSelect: (index: number) => void
}

export function QuizCard({
  sessionQuestion,
  selectedIndex,
  isAnswered,
  onSelect,
}: QuizCardProps) {
  const { question, isReview } = sessionQuestion
  const isCorrect = selectedIndex === question.correctIndex
  const quizT = useTranslations('quiz')
  const topicT = useTranslations('topics')

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
          {topicT(question.topic)}
        </span>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {quizT(DIFFICULTY_KEYS[question.difficulty])}
        </span>
        {isReview && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            {quizT('review')}
          </span>
        )}
        <div className="ml-auto">
          <BookmarkButton questionId={question.id} />
        </div>
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
        <Explanation
          isCorrect={isCorrect}
          explanation={question.explanation}
          sourceUrl={question.sourceUrl}
        />
      )}

      {/* Bottom padding so content isn't hidden behind floating button */}
      {isAnswered && <div className="h-24" />}
    </motion.div>
  )
}

export function NextButton({
  isAnswered,
  isLast,
  onNext,
}: {
  isAnswered: boolean
  isLast: boolean
  onNext: () => void
}) {
  const t = useTranslations('quiz')

  if (isAnswered === false) return null

  const label = isLast ? t('showResult') : t('nextQuestion')

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onNext}
          aria-label={label}
          className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          {label}
        </button>
      </div>
    </div>
  )
}
