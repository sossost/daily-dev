'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { AnimatePresence } from 'framer-motion'
import { ArrowLeft, Infinity as InfinityIcon, Square } from 'lucide-react'
import { TOPICS, type Topic, type Difficulty, type SessionAnswer } from '@/types'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import {
  generateEndlessPool,
  computeEndlessResult,
  type EndlessResult,
} from '@/lib/endless-session'
import { countAvailableQuestions } from '@/lib/practice-session'
import { TopicSelector } from '@/components/practice/TopicSelector'
import { QuizCard } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'
import { EndlessResultView } from '@/components/endless/EndlessResultView'

type EndlessPhase = 'setup' | 'quiz' | 'result'

export default function EndlessPage() {
  const t = useTranslations('endless')
  const tp = useTranslations('practice')
  const tc = useTranslations('common')
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()

  const [phase, setPhase] = useState<EndlessPhase>('setup')
  const [selectedTopics, setSelectedTopics] = useState<readonly Topic[]>([...TOPICS])
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all')
  const [questions, setQuestions] = useState<ReturnType<typeof generateEndlessPool>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [result, setResult] = useState<EndlessResult | null>(null)

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
    const pool = generateEndlessPool({ topics: selectedTopics, difficulty, locale })
    if (pool.length === 0) return
    setQuestions(pool)
    setCurrentIndex(0)
    setSelectedIndex(null)
    setIsAnswered(false)
    setAnswers([])
    setResult(null)
    setPhase('quiz')
  }, [selectedTopics, difficulty, locale])

  const handleSelect = useCallback((index: number) => {
    if (isAnswered) return
    setSelectedIndex(index)
    setIsAnswered(true)

    const currentQ = questions[currentIndex]
    if (currentQ == null) return

    const newAnswer: SessionAnswer = {
      questionId: currentQ.question.id,
      topic: currentQ.question.topic,
      selectedIndex: index,
      isCorrect: index === currentQ.question.correctIndex,
      timeSpent: 0,
    }
    setAnswers((prev) => [...prev, newAnswer])
  }, [isAnswered, questions, currentIndex])

  const handleNext = useCallback(() => {
    if (!isAnswered) return
    const nextIdx = currentIndex + 1
    if (nextIdx >= questions.length) {
      // Ran out of questions
      const finalResult = computeEndlessResult(answers)
      setResult(finalResult)
      setPhase('result')
      return
    }
    setCurrentIndex(nextIdx)
    setSelectedIndex(null)
    setIsAnswered(false)
  }, [isAnswered, currentIndex, questions.length, answers])

  const handleStop = useCallback(() => {
    const finalResult = computeEndlessResult(answers)
    setResult(finalResult)
    setPhase('result')
  }, [answers])

  const handleRetry = useCallback(() => {
    setPhase('setup')
    setResult(null)
    setAnswers([])
  }, [])

  const handleHome = useCallback(() => {
    router.push('/')
  }, [router])

  useQuizKeyboard({
    isAnswered: phase === 'quiz' ? isAnswered : false,
    onSelect: handleSelect,
    onNext: handleNext,
  })

  if (isHydrated === false) {
    return null
  }

  if (phase === 'result' && result != null) {
    return (
      <div>
        <header className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3"
          >
            <ArrowLeft size={16} />
            {tc('home')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <InfinityIcon size={22} className="text-teal-500" />
            {t('result')}
          </h1>
        </header>
        <EndlessResultView result={result} onRetry={handleRetry} onHome={handleHome} />
      </div>
    )
  }

  if (phase === 'quiz') {
    const currentQuestion = questions[currentIndex]
    if (currentQuestion == null) return null
    const correctCount = answers.filter((a) => a.isCorrect).length

    return (
      <div>
        <KeyboardHint />
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('questionsCompleted', { count: answers.length })}
          </span>
          <span className="text-sm font-medium text-emerald-500">
            {t('correctCount', { count: correctCount })}
          </span>
        </div>
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQuestion.question.id}
            sessionQuestion={currentQuestion}
            selectedIndex={selectedIndex}
            isAnswered={isAnswered}
            onSelect={handleSelect}
          />
        </AnimatePresence>
        <div className="flex gap-3 mt-4">
          {isAnswered && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-colors"
            >
              {currentIndex + 1 >= questions.length
                ? t('showResult')
                : t('nextQuestion')}
            </button>
          )}
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label={t('stopSession')}
          >
            <Square size={14} />
            {t('stop')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-3"
        >
          <ArrowLeft size={16} />
          {tc('home')}
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <InfinityIcon size={22} className="text-teal-500" />
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
          onClick={handleStart}
          disabled={availableCount === 0}
          className="w-full py-3 rounded-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          aria-label={t('startEndless', { count: availableCount })}
        >
          {availableCount === 0
            ? tp('noQuestions')
            : t('startEndless', { count: availableCount })}
        </button>
      </div>
    </div>
  )
}
