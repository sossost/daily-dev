'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { AnimatePresence } from 'framer-motion'
import { TOPICS } from '@/types'
import { isLocale } from '@/i18n/routing'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import { generateSession } from '@/lib/session'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'

export default function SessionContent() {
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const isHydrated = useHydration()

  const questions = useSessionStore((s) => s.questions)
  const currentIndex = useSessionStore((s) => s.currentIndex)
  const selectedIndex = useSessionStore((s) => s.selectedIndex)
  const answers = useSessionStore((s) => s.answers)
  const isAnswered = useSessionStore((s) => s.isAnswered)
  const isComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const nextQuestion = useSessionStore((s) => s.nextQuestion)

  // Clear stale session state synchronously on mount.
  // Prevents redirect to result page from previous session's isComplete=true.
  const cleared = useRef(false)
  if (!cleared.current) {
    cleared.current = true
    useSessionStore.getState().reset()
  }

  useQuizKeyboard({
    isAnswered,
    onSelect: selectAnswer,
    onNext: nextQuestion,
  })

  const topicFilter = enabledTopics.length < TOPICS.length ? enabledTopics : undefined
  const sessionQuestions = useMemo(
    () => generateSession(srsRecords, topicFilter, locale),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Start fresh session once topicFilter store is hydrated
  useEffect(() => {
    if (isHydrated === false) return
    startSession(sessionQuestions)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when hydrated
  }, [isHydrated])

  useEffect(() => {
    if (isComplete === true && answers.length > 0) {
      router.push('/session/result')
    }
  }, [isComplete, answers.length, router])

  if (isHydrated === false || questions.length === 0) {
    return null
  }

  const currentQuestion = questions[currentIndex]
  if (currentQuestion == null) {
    return null
  }

  const isLast = currentIndex === questions.length - 1

  return (
    <div>
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-block"
          aria-label="Home"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </header>
      <KeyboardHint />
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
