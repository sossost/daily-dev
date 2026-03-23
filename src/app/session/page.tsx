'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { generateSession } from '@/lib/session'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'

export default function SessionPage() {
  const router = useRouter()
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const isHydrated = useHydration()

  const questions = useSessionStore((s) => s.questions)
  const currentIndex = useSessionStore((s) => s.currentIndex)
  const selectedIndex = useSessionStore((s) => s.selectedIndex)
  const isAnswered = useSessionStore((s) => s.isAnswered)
  const isComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const nextQuestion = useSessionStore((s) => s.nextQuestion)

  const sessionQuestions = useMemo(
    () => generateSession(srsRecords),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    if (!isHydrated) return
    if (questions.length === 0) {
      startSession(sessionQuestions)
    }
  }, [isHydrated, questions.length, startSession, sessionQuestions])

  useEffect(() => {
    if (isComplete === true) {
      router.push('/session/result')
    }
  }, [isComplete, router])

  if (!isHydrated || questions.length === 0) {
    return null
  }

  const currentQuestion = questions[currentIndex]
  if (currentQuestion == null) {
    return null
  }

  const isLast = currentIndex === questions.length - 1

  return (
    <div>
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <AnimatePresence mode="wait">
        <QuizCard
          key={currentQuestion.question.id}
          sessionQuestion={currentQuestion}
          selectedIndex={selectedIndex}
          isAnswered={isAnswered}
          onSelect={selectAnswer}
        />
      </AnimatePresence>
      <NextButton isAnswered={isAnswered} isLast={isLast} onNext={nextQuestion} />
    </div>
  )
}
