'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { generateSession } from '@/lib/session'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'

export default function SessionPage() {
  const router = useRouter()
  const completedToday = useProgressStore((s) => s.completedToday)
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const refreshDailyState = useProgressStore((s) => s.refreshDailyState)

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
    refreshDailyState()
  }, [refreshDailyState])

  useEffect(() => {
    if (completedToday === true) {
      router.replace('/')
      return
    }

    if (questions.length === 0) {
      startSession(sessionQuestions)
    }
  }, [completedToday, questions.length, startSession, sessionQuestions, router])

  useEffect(() => {
    if (isComplete === true) {
      router.push('/session/result')
    }
  }, [isComplete, router])

  if (completedToday === true || questions.length === 0) {
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
