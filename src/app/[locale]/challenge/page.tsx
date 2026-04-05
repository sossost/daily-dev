'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Zap } from 'lucide-react'
import { useHydration } from '@/hooks/useHydration'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import {
  generateChallengeSession,
  computeChallengeResult,
  CHALLENGE_DURATIONS,
  CHALLENGE_DURATION_KEYS,
  type ChallengeDuration,
  type ChallengeResult as ChallengeResultData,
} from '@/lib/challenge-session'
import type { SessionQuestion, SessionAnswer } from '@/types'
import { createTopicFilter } from '@/lib/topics'
import { ChallengeTimer } from '@/components/challenge/ChallengeTimer'
import { ChallengeResult } from '@/components/challenge/ChallengeResult'
import { QuizCard } from '@/components/quiz/QuizCard'

type ChallengePhase = 'setup' | 'quiz' | 'result'

const ANIMATION_DELAY_STEP = 0.05
const DEFAULT_DURATION: ChallengeDuration = 60
const AUTO_ADVANCE_MS = 400

export default function ChallengePage() {
  const router = useRouter()
  const t = useTranslations('challenge')
  const tc = useTranslations('common')
  const isHydrated = useHydration()
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const topicFilter = createTopicFilter(enabledTopics)

  const [phase, setPhase] = useState<ChallengePhase>('setup')
  const [duration, setDuration] = useState<ChallengeDuration>(DEFAULT_DURATION)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [result, setResult] = useState<ChallengeResultData | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Store a ref to answers for the timer callback
  const answersRef = useRef(answers)
  answersRef.current = answers
  const durationRef = useRef(duration)
  durationRef.current = duration

  const handleTimeUp = useCallback(() => {
    setIsTimerRunning(false)
    if (autoAdvanceRef.current != null) {
      clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
    const finalResult = computeChallengeResult(answersRef.current, durationRef.current)
    setResult(finalResult)
    setPhase('result')
  }, [])

  const handleSelect = useCallback((index: number) => {
    if (isAnswered) return
    setSelectedIndex(index)
    setIsAnswered(true)

    setAnswers((prev) => {
      const currentQ = questions[currentIndex]
      if (currentQ == null) return prev
      const newAnswer: SessionAnswer = {
        questionId: currentQ.question.id,
        topic: currentQ.question.topic,
        selectedIndex: index,
        isCorrect: index === currentQ.question.correctIndex,
        timeSpent: 0,
      }
      return [...prev, newAnswer]
    })

    // Auto-advance after brief feedback
    autoAdvanceRef.current = setTimeout(() => {
      autoAdvanceRef.current = null
      setCurrentIndex((prev) => prev + 1)
      setSelectedIndex(null)
      setIsAnswered(false)
    }, AUTO_ADVANCE_MS)
  }, [isAnswered, questions, currentIndex])

  const handleNext = useCallback(() => {
    // In challenge mode, auto-advance handles this
  }, [])

  useQuizKeyboard({
    isAnswered: phase === 'quiz' ? isAnswered : false,
    onSelect: handleSelect,
    onNext: handleNext,
  })

  const handleStart = useCallback(() => {
    const sessionQuestions = generateChallengeSession(topicFilter)
    setQuestions(sessionQuestions)
    setCurrentIndex(0)
    setSelectedIndex(null)
    setIsAnswered(false)
    setAnswers([])
    setResult(null)
    setPhase('quiz')
    setIsTimerRunning(true)
  }, [topicFilter])

  const handleRetry = useCallback(() => {
    setPhase('setup')
    setResult(null)
    setAnswers([])
  }, [])

  const handleHome = useCallback(() => {
    router.push('/')
  }, [router])

  // Handle running out of questions before time
  useEffect(() => {
    if (phase === 'quiz' && questions[currentIndex] == null && result == null) {
      setIsTimerRunning(false)
      const finalResult = computeChallengeResult(answers, duration)
      setResult(finalResult)
      setPhase('result')
    }
  }, [phase, currentIndex, questions, answers, duration, result])

  if (isHydrated === false) {
    return null
  }

  // Result phase
  if (phase === 'result' && result != null) {
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('result')}</h1>
        </header>
        <ChallengeResult result={result} onRetry={handleRetry} onHome={handleHome} />
      </div>
    )
  }

  // Quiz phase
  if (phase === 'quiz') {
    const currentQuestion = questions[currentIndex]
    if (currentQuestion == null) return null

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
          <ChallengeTimer
            durationSeconds={duration}
            isRunning={isTimerRunning}
            onTimeUp={handleTimeUp}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('questionsCompleted', { count: answers.length })}
            </span>
            <span className="text-sm font-medium text-emerald-500">
              {t('correctCount', { count: answers.filter((a) => a.isCorrect).length })}
            </span>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentQuestion.question.id}
            sessionQuestion={currentQuestion}
            selectedIndex={selectedIndex}
            isAnswered={isAnswered}
            onSelect={handleSelect}
          />
        </AnimatePresence>
      </div>
    )
  }

  // Setup phase
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

      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('selectTime')}</p>
        {CHALLENGE_DURATIONS.map((d, i) => (
          <motion.button
            key={d}
            type="button"
            onClick={() => setDuration(d)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * ANIMATION_DELAY_STEP }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              duration === d
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
            }`}
            aria-pressed={duration === d}
          >
            <Zap
              size={18}
              className={duration === d ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'}
            />
            <span
              className={`text-sm font-medium ${
                duration === d
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {t(CHALLENGE_DURATION_KEYS[d])}
            </span>
          </motion.button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="w-full py-3 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-colors"
        aria-label={t('startChallenge')}
      >
        {t('startChallenge')}
      </button>
    </div>
  )
}
