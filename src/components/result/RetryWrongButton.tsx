'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { SessionQuestion, SessionAnswer } from '@/types'
import { useSessionStore } from '@/stores/useSessionStore'
import { shuffleOptions } from '@/lib/session'

interface RetryWrongButtonProps {
  readonly questions: readonly SessionQuestion[]
  readonly answers: readonly SessionAnswer[]
}

export function RetryWrongButton({ questions, answers }: RetryWrongButtonProps) {
  const router = useRouter()
  const reset = useSessionStore((s) => s.reset)
  const startSession = useSessionStore((s) => s.startSession)

  const incorrectAnswers = answers.filter((a) => !a.isCorrect)

  const handleRetry = useCallback(() => {
    const wrongQuestions: SessionQuestion[] = incorrectAnswers
      .map((answer) => {
        const sessionQuestion = questions.find(
          (q) => q.question.id === answer.questionId
        )
        if (sessionQuestion == null) return null
        return {
          question: shuffleOptions(sessionQuestion.question),
          isReview: true,
        }
      })
      .filter((q): q is SessionQuestion => q != null)

    if (wrongQuestions.length === 0) return

    reset()
    startSession(wrongQuestions)
    router.push('/session')
  }, [incorrectAnswers, questions, reset, startSession, router])

  if (incorrectAnswers.length === 0) {
    return null
  }

  return (
    <motion.button
      type="button"
      onClick={handleRetry}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full mt-3 py-3 rounded-xl font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
      aria-label={`틀린 ${incorrectAnswers.length}문제 다시 풀기`}
    >
      <RotateCcw size={16} />
      틀린 {incorrectAnswers.length}문제 다시 풀기
    </motion.button>
  )
}
