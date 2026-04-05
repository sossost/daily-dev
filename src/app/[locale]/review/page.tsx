'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  FileX2,
  RotateCcw,

  Zap,
} from 'lucide-react'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import { useQuizKeyboard } from '@/hooks/useQuizKeyboard'
import { analyzeFocusAreas, generateFocusSession } from '@/lib/focus-session'
import {
  extractWrongAnswers,
  groupWrongAnswersByTopic,
  generateWrongAnswerSession,
} from '@/lib/wrong-answers'
import { createTopicFilter } from '@/lib/topics'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizCard, NextButton } from '@/components/quiz/QuizCard'
import { KeyboardHint } from '@/components/quiz/KeyboardHint'
import { WrongAnswerCard } from '@/components/review/WrongAnswerCard'

type ReviewTab = 'focus' | 'wrongAnswers'

const ANIMATION_DELAY_STEP = 0.06
const SESSION_LIMIT = 10

export default function ReviewPage() {
  const t = useTranslations('review')
  const tf = useTranslations('focus')
  const tw = useTranslations('wrongAnswers')
  const tc = useTranslations('common')
  const topicT = useTranslations('topics')
  const router = useRouter()
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()

  const topicStats = useProgressStore((s) => s.topicStats)
  const srsRecords = useProgressStore((s) => s.srsRecords)
  const sessions = useProgressStore((s) => s.sessions)
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const topicFilter = createTopicFilter(enabledTopics)

  const [tab, setTab] = useState<ReviewTab>('focus')
  const [isQuizActive, setIsQuizActive] = useState(false)

  // Session store
  const questions = useSessionStore((s) => s.questions)
  const currentIndex = useSessionStore((s) => s.currentIndex)
  const selectedIndex = useSessionStore((s) => s.selectedIndex)
  const isAnswered = useSessionStore((s) => s.isAnswered)
  const isComplete = useSessionStore((s) => s.isComplete)
  const startSession = useSessionStore((s) => s.startSession)
  const selectAnswer = useSessionStore((s) => s.selectAnswer)
  const nextQuestion = useSessionStore((s) => s.nextQuestion)
  const resetSession = useSessionStore((s) => s.reset)

  useEffect(() => {
    resetSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useQuizKeyboard({
    isAnswered: isQuizActive ? isAnswered : false,
    onSelect: selectAnswer,
    onNext: nextQuestion,
  })

  // Focus analysis
  const analysis = useMemo(
    () => analyzeFocusAreas(topicStats, srsRecords, locale, topicFilter),
    [topicStats, srsRecords, locale, topicFilter],
  )

  // Wrong answers
  const wrongEntries = useMemo(
    () => extractWrongAnswers(sessions, topicFilter),
    [sessions, topicFilter],
  )
  const topicGroups = useMemo(
    () => groupWrongAnswersByTopic(wrongEntries),
    [wrongEntries],
  )

  const handleStartFocus = useCallback(() => {
    resetSession()
    const sessionQuestions = generateFocusSession(topicStats, srsRecords, locale, topicFilter)
    if (sessionQuestions.length === 0) return
    startSession(sessionQuestions)
    setIsQuizActive(true)
  }, [topicStats, srsRecords, locale, topicFilter, resetSession, startSession])

  const handleRetryWrong = useCallback(() => {
    const limited = wrongEntries.slice(0, SESSION_LIMIT)
    const sessionQuestions = generateWrongAnswerSession(limited)
    if (sessionQuestions.length === 0) return
    resetSession()
    startSession([...sessionQuestions])
    setIsQuizActive(true)
  }, [wrongEntries, resetSession, startSession])

  useEffect(() => {
    if (isQuizActive && isComplete === true) {
      router.push('/session/result')
    }
  }, [isQuizActive, isComplete, router])

  if (isHydrated === false) {
    return null
  }

  // Quiz phase
  if (isQuizActive && questions.length > 0) {
    const currentQuestion = questions[currentIndex]
    if (currentQuestion == null) return null
    const isLast = currentIndex === questions.length - 1

    return (
      <div>
        <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 -mx-4 px-4 -mt-8 pt-3 pb-3">
          <button
            type="button"
            onClick={() => { resetSession(); setIsQuizActive(false) }}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={tc('home')}
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
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

  const hasWeakAreas = analysis.weakTopics.length > 0 || analysis.strugglingQuestionCount > 0

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

      {/* Tab toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('focus')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'focus'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('tabFocus')}
        </button>
        <button
          type="button"
          onClick={() => setTab('wrongAnswers')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'wrongAnswers'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {t('tabWrongAnswers')}
          {wrongEntries.length > 0 && (
            <span className="ml-1 text-xs opacity-80">({wrongEntries.length})</span>
          )}
        </button>
      </div>

      {/* Focus tab */}
      {tab === 'focus' && (
        <div>
          <div className="space-y-4 pb-20">
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
                        {tf('weakTopics')}
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
                    <Zap size={16} className="text-blue-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tf('hardQuestions')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tf('frequentMistakes', { count: analysis.strugglingQuestionCount })}
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
                    {tf('noWeakness')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tf('noWeaknessDescription')}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="fixed bottom-6 left-0 right-0 z-20 px-4">
            <div className="max-w-lg mx-auto">
              <button
                type="button"
                onClick={handleStartFocus}
                disabled={analysis.availableCount === 0}
                className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg"
                aria-label={tf('startFocus')}
              >
                {analysis.availableCount === 0
                  ? tf('noQuestions')
                  : `${tf('startFocus')} (${analysis.availableCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wrong Answers tab */}
      {tab === 'wrongAnswers' && (
        <div>
          {wrongEntries.length === 0 ? (
            <div className="text-center py-16">
              <FileX2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {tw('empty')}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {tw('emptyDescription')}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6 pb-20">
                {topicGroups.map((group, groupIndex) => (
                  <motion.section
                    key={group.topic}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.04 }}
                  >
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {topicT(group.topic)}
                      <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                        {tc('items', { count: group.entries.length })}
                      </span>
                    </h2>
                    <div className="space-y-2">
                      {group.entries.map((entry) => (
                        <WrongAnswerCard key={entry.question.id} entry={entry} />
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            </>
          )}

          {wrongEntries.length > 0 && (
            <div className="fixed bottom-6 left-0 right-0 z-20 px-4">
              <div className="max-w-lg mx-auto">
                <button
                  type="button"
                  onClick={handleRetryWrong}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  aria-label={tw('retryAll')}
                >
                  <RotateCcw size={16} />
                  {tw('retryAllButton', { count: Math.min(wrongEntries.length, SESSION_LIMIT) })}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
