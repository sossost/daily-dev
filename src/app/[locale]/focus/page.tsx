'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Target, AlertTriangle, Zap, BookOpen } from 'lucide-react'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import { analyzeFocusAreas, generateFocusSession } from '@/lib/focus-session'
import { createTopicFilter } from '@/lib/topics'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'

const ANIMATION_DELAY_STEP = 0.06

type FocusPhase = 'analysis' | 'quiz'

export default function FocusPage() {
  const t = useTranslations('focus')
  const tc = useTranslations('common')
  const topicT = useTranslations('topics')
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const topicStats = useProgressStore((s) => s.topicStats)
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const topicFilter = createTopicFilter(enabledTopics)

  const cleared = useRef(false)
  if (!cleared.current) {
    cleared.current = true
    useSessionStore.getState().reset()
  }

  const questions = useSessionStore((s) => s.questions)
  const currentIndex = useSessionStore((s) => s.currentIndex)
  const selectedIndex = useSessionStore((s) => s.selectedIndex)
  const isAnswered = useSessionStore((s) => s.isAnswered)
  const isComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const nextQuestion = useSessionStore((s) => s.nextQuestion)
  const reset = useSessionStore((s) => s.reset)

  const phase: FocusPhase = questions.length > 0 ? 'quiz' : 'analysis'

  useQuizKeyboard({
    isAnswered: phase === 'quiz' ? isAnswered : false,
    onSelect: selectAnswer,
    onNext: nextQuestion,
  })

  const analysis = useMemo(
    () => analyzeFocusAreas(topicStats, srsRecords, locale, topicFilter),
    [topicStats, srsRecords, locale, topicFilter],
  )

  const handleStartFocus = useCallback(() => {
    reset()
    const sessionQuestions = generateFocusSession(topicStats, srsRecords, locale, topicFilter)
    if (sessionQuestions.length === 0) return
    startSession(sessionQuestions)
  }, [topicStats, srsRecords, locale, topicFilter, reset, startSession])

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

  const hasWeakAreas = analysis.weakTopics.length > 0 || analysis.strugglingQuestionCount > 0

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
          <Target size={22} className="text-orange-500" />
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('subtitle')}
        </p>
      </header>

      <div className="space-y-4 mb-6">
        {hasWeakAreas ? (
          <>
            {analysis.weakTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('weakTopics')}
                  </h2>
                </div>
                <div className="space-y-2">
                  {analysis.weakTopics.map((topic, i) => (
                    <motion.div
                      key={topic.topic}
                      className="flex items-center justify-between py-1.5"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * ANIMATION_DELAY_STEP }}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {topicT(topic.topic)}
                      </span>
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {topic.accuracy}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {analysis.strugglingQuestionCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <Zap size={16} className="text-orange-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('hardQuestions')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('frequentMistakes', { count: analysis.strugglingQuestionCount })}
                  </p>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
          >
            <BookOpen size={16} className="text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('noWeakness')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('noWeaknessDescription')}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={handleStartFocus}
        disabled={analysis.availableCount === 0}
        className="w-full py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        aria-label={t('startFocus')}
      >
        {analysis.availableCount === 0
          ? t('noQuestions')
          : `${t('startFocus')} (${analysis.availableCount})`}
      </button>
    </div>
  )
}
