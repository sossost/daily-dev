'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Square } from 'lucide-react'
import { TOPICS, SESSION_TOTAL_QUESTIONS, type Topic, type Difficulty, type SessionAnswer, type SessionQuestion } from '@/types'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import { generatePracticeSession, countAvailableQuestions } from '@/lib/practice-session'
import { generateEndlessPool, computeEndlessResult, type EndlessResult } from '@/lib/endless-session'
import { TopicSelector } from '@/components/practice/TopicSelector'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'
import { EndlessResultView } from '@/components/endless/EndlessResultView'

type PracticeMode = 'standard' | 'endless'
type PracticePhase = 'setup' | 'quiz' | 'result'

export default function PracticePage() {
  const t = useTranslations('practice')
  const te = useTranslations('endless')
  const tc = useTranslations('common')
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const srsRecords = useProgressStore((s) => s.srsRecords)

  useEffect(() => {
    resetSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [phase, setPhase] = useState<PracticePhase>('setup')
  const [mode, setMode] = useState<PracticeMode>('standard')
  const [selectedTopics, setSelectedTopics] = useState<readonly Topic[]>([...TOPICS])
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')

  // Standard mode — session store
  const storeQuestions = useSessionStore((s) => s.questions)
  const storeCurrentIndex = useSessionStore((s) => s.currentIndex)
  const storeSelectedIndex = useSessionStore((s) => s.selectedIndex)
  const storeIsAnswered = useSessionStore((s) => s.isAnswered)
  const storeIsComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const storeNextQuestion = useSessionStore((s) => s.nextQuestion)
  const resetSession = useSessionStore((s) => s.reset)

  // Endless mode — local state
  const [endlessQuestions, setEndlessQuestions] = useState<SessionQuestion[]>([])
  const [endlessIndex, setEndlessIndex] = useState(0)
  const [endlessSelectedIndex, setEndlessSelectedIndex] = useState<number | null>(null)
  const [endlessIsAnswered, setEndlessIsAnswered] = useState(false)
  const [endlessAnswers, setEndlessAnswers] = useState<SessionAnswer[]>([])
  const [endlessResult, setEndlessResult] = useState<EndlessResult | null>(null)

  const handleEndlessSelect = useCallback((index: number) => {
    if (endlessIsAnswered === true) return
    setEndlessSelectedIndex(index)
    setEndlessIsAnswered(true)

    const currentQ = endlessQuestions[endlessIndex]
    if (currentQ == null) return

    const newAnswer: SessionAnswer = {
      questionId: currentQ.question.id,
      topic: currentQ.question.topic,
      selectedIndex: index,
      isCorrect: index === currentQ.question.correctIndex,
      timeSpent: 0,
    }
    setEndlessAnswers((prev) => [...prev, newAnswer])
  }, [endlessIsAnswered, endlessQuestions, endlessIndex])

  const handleEndlessNext = useCallback(() => {
    if (endlessIsAnswered === false) return
    const nextIdx = endlessIndex + 1
    if (nextIdx >= endlessQuestions.length) {
      setEndlessResult(computeEndlessResult(endlessAnswers))
      setPhase('result')
      return
    }
    setEndlessIndex(nextIdx)
    setEndlessSelectedIndex(null)
    setEndlessIsAnswered(false)
  }, [endlessIsAnswered, endlessIndex, endlessQuestions.length, endlessAnswers])

  useQuizKeyboard({
    isAnswered: phase === 'quiz'
      ? (mode === 'standard' ? storeIsAnswered : endlessIsAnswered)
      : false,
    onSelect: mode === 'standard' ? selectAnswer : handleEndlessSelect,
    onNext: mode === 'standard' ? storeNextQuestion : handleEndlessNext,
  })

  const availableCount = useMemo(
    () => countAvailableQuestions(selectedTopics, difficulty, locale),
    [selectedTopics, difficulty, locale],
  )

  const handleToggleTopic = useCallback((topic: Topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic],
    )
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

  const handleStart = useCallback(() => {
    if (mode === 'standard') {
      resetSession()
      const sessionQuestions = generatePracticeSession({
        topics: selectedTopics,
        difficulty,
        srsRecords,
        locale,
      })
      if (sessionQuestions.length === 0) return
      startSession(sessionQuestions)
    } else {
      const pool = generateEndlessPool({ topics: selectedTopics, difficulty, locale })
      if (pool.length === 0) return
      setEndlessQuestions(pool)
      setEndlessIndex(0)
      setEndlessSelectedIndex(null)
      setEndlessIsAnswered(false)
      setEndlessAnswers([])
      setEndlessResult(null)
    }
    setPhase('quiz')
  }, [mode, selectedTopics, difficulty, srsRecords, locale, resetSession, startSession])

  const handleStop = useCallback(() => {
    if (mode !== 'endless') return
    setEndlessResult(computeEndlessResult(endlessAnswers))
    setPhase('result')
  }, [mode, endlessAnswers])

  const handleRetry = useCallback(() => {
    setPhase('setup')
    setEndlessResult(null)
    setEndlessAnswers([])
  }, [])

  const handleHome = useCallback(() => {
    router.push('/')
  }, [router])

  useEffect(() => {
    if (mode === 'standard' && storeIsComplete === true) {
      router.push('/session/result')
    }
  }, [mode, storeIsComplete, router])

  if (isHydrated === false) {
    return null
  }

  // Endless result
  if (phase === 'result' && endlessResult != null) {
    return (
      <div>
        <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={tc('home')}
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{te('result')}</h1>
        </header>
        <EndlessResultView result={endlessResult} onRetry={handleRetry} onHome={handleHome} />
      </div>
    )
  }

  // Standard quiz
  if (phase === 'quiz' && mode === 'standard') {
    const currentQuestion = storeQuestions[storeCurrentIndex]
    if (currentQuestion == null) return null
    const isLast = storeCurrentIndex === storeQuestions.length - 1

    return (
      <div>
        <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-block"
            aria-label={tc('home')}
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <ProgressBar current={storeCurrentIndex + 1} total={storeQuestions.length} />
        </header>
        <KeyboardHint />
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQuestion.question.id}
            sessionQuestion={currentQuestion}
            selectedIndex={storeSelectedIndex}
            isAnswered={storeIsAnswered}
            onSelect={selectAnswer}
          />
        </AnimatePresence>
        <NextButton isAnswered={storeIsAnswered} isLast={isLast} onNext={storeNextQuestion} />
      </div>
    )
  }

  // Endless quiz
  if (phase === 'quiz' && mode === 'endless') {
    const currentQuestion = endlessQuestions[endlessIndex]
    if (currentQuestion == null) return null
    const correctCount = endlessAnswers.filter((a) => a.isCorrect).length

    return (
      <div>
        <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3">
          <Link
            href="/"
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-block"
            aria-label={tc('home')}
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {te('questionsCompleted', { count: endlessAnswers.length })}
          </span>
          <span className="text-sm font-medium text-emerald-500">
            {te('correctCount', { count: correctCount })}
          </span>
          </div>
        </header>
        <KeyboardHint />
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQuestion.question.id}
            sessionQuestion={currentQuestion}
            selectedIndex={endlessSelectedIndex}
            isAnswered={endlessIsAnswered}
            onSelect={handleEndlessSelect}
          />
        </AnimatePresence>
        <div className="flex gap-3 mt-4">
          {endlessIsAnswered && (
            <button
              type="button"
              onClick={handleEndlessNext}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              {endlessIndex + 1 >= endlessQuestions.length
                ? te('showResult')
                : te('nextQuestion')}
            </button>
          )}
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label={te('stopSession')}
          >
            <Square size={14} />
            {te('stop')}
          </button>
        </div>
      </div>
    )
  }

  // Setup
  return (
    <div>
      <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={tc('home')}
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
      </header>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('standard')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'standard'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('modeStandard')}
        </button>
        <button
          type="button"
          onClick={() => setMode('endless')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'endless'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('modeEndless')}
        </button>
      </div>

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
          onClick={handleStart}
          disabled={availableCount === 0}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          aria-label={mode === 'standard'
            ? t('startPractice', { count: availableCount, max: SESSION_TOTAL_QUESTIONS })
            : te('startEndless', { count: availableCount })}
        >
          {availableCount === 0
            ? t('noQuestions')
            : mode === 'standard'
              ? t('startPractice', { count: availableCount, max: SESSION_TOTAL_QUESTIONS })
              : te('startEndless', { count: availableCount })}
        </button>
      </div>
    </div>
  )
}
