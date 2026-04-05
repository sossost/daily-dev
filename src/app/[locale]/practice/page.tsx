'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { TOPICS, SESSION_TOTAL_QUESTIONS, type Topic, type Difficulty } from '@/types'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import { generatePracticeSession, countAvailableQuestions } from '@/lib/practice-session'
import { TopicSelector } from '@/components/practice/TopicSelector'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'

type PracticePhase = 'setup' | 'quiz'

export default function PracticePage() {
  const t = useTranslations('practice')
  const tc = useTranslations('common')
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const srsRecords = useProgressStore((s) => s.srsRecords)

  // Clear stale session state synchronously on mount.
  // Prevents redirect to result page from previous session's isComplete=true.
  const cleared = useRef(false)
  if (!cleared.current) {
    cleared.current = true
    useSessionStore.getState().reset()
  }

  const [phase, setPhase] = useState<PracticePhase>('setup')
  const [selectedTopics, setSelectedTopics] = useState<readonly Topic[]>([...TOPICS])
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')

  const questions = useSessionStore((s) => s.questions)
  const currentIndex = useSessionStore((s) => s.currentIndex)
  const selectedIndex = useSessionStore((s) => s.selectedIndex)
  const isAnswered = useSessionStore((s) => s.isAnswered)
  const isComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const nextQuestion = useSessionStore((s) => s.nextQuestion)
  const reset = useSessionStore((s) => s.reset)

  useQuizKeyboard({
    isAnswered: phase === 'quiz' ? isAnswered : false,
    onSelect: selectAnswer,
    onNext: nextQuestion,
  })

  const availableCount = useMemo(
    () => countAvailableQuestions(selectedTopics, difficulty, locale),
    [selectedTopics, difficulty, locale],
  )

  const handleToggleTopic = useCallback((topic: Topic) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic)
      }
      return [...prev, topic]
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedTopics([...TOPICS])
  }, [])

  const handleDeselectAll = useCallback(() => {
    setSelectedTopics([])
  }, [])

  const handleToggleCategory = useCallback((topics: readonly Topic[]) => {
    setSelectedTopics((prev) => {
      const prevSet = new Set(prev)
      const topicsSet = new Set(topics)
      const allSelected = topics.every((t) => prevSet.has(t))

      if (allSelected) {
        return prev.filter((t) => !topicsSet.has(t))
      }
      return [...prev, ...topics.filter((t) => !prevSet.has(t))]
    })
  }, [])

  const handleDifficultyChange = useCallback((d: Difficulty | 'all') => {
    setDifficulty(d)
  }, [])

  const handleStartPractice = useCallback(() => {
    reset()
    const sessionQuestions = generatePracticeSession({
      topics: selectedTopics,
      difficulty,
      srsRecords,
      locale,
    })
    if (sessionQuestions.length === 0) return
    startSession(sessionQuestions)
    setPhase('quiz')
  }, [selectedTopics, difficulty, srsRecords, locale, reset, startSession])

  useEffect(() => {
    if (isComplete === true) {
      router.push('/session/result')
    }
  }, [isComplete, router])

  if (isHydrated === false) {
    return null
  }

  if (phase === 'quiz') {
    const currentQuestion = questions[currentIndex]
    if (currentQuestion == null) return null
    const isLast = currentIndex === questions.length - 1

    return (
      <div>
        <KeyboardHint />
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

  return (
    <div>
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3"
        >
          <ArrowLeft size={16} />
          {tc('home')}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Dumbbell size={22} className="text-blue-500" />
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('subtitle')}
        </p>
      </header>

      <TopicSelector
        selectedTopics={selectedTopics}
        difficulty={difficulty}
        onToggleTopic={handleToggleTopic}
        onToggleCategory={handleToggleCategory}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDifficultyChange={handleDifficultyChange}
      />

      <div className="mt-6">
        <button
          type="button"
          onClick={handleStartPractice}
          disabled={availableCount === 0}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          aria-label={t('startPractice', { count: availableCount, max: SESSION_TOTAL_QUESTIONS })}
        >
          {availableCount === 0
            ? t('noQuestions')
            : t('startPractice', { count: availableCount, max: SESSION_TOTAL_QUESTIONS })}
        </button>
      </div>
    </div>
  )
}
