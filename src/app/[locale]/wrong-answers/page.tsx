'use client'

import { useCallback, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, FileX2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useHydration } from '@/hooks/useHydration'
import {
  extractWrongAnswers,
  groupWrongAnswersByTopic,
  generateWrongAnswerSession,
} from '@/lib/wrong-answers'
import type { WrongAnswerEntry } from '@/lib/wrong-answers'
import { createTopicFilter } from '@/lib/topics'
import { CodeBlock } from '@/components/quiz/CodeBlock'
import { BookmarkButton } from '@/components/quiz/BookmarkButton'

const ANIMATION_DELAY_STEP = 0.04
const SESSION_LIMIT = 10

function WrongAnswerCard({ entry }: { readonly entry: WrongAnswerEntry }) {
  const t = useTranslations('wrongAnswers')
  const topicT = useTranslations('topics')
  const quizT = useTranslations('quiz')
  const [isExpanded, setIsExpanded] = useState(false)
  const { question, wrongCount } = entry

  return (
    <motion.div
      layout
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
            {question.question}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
              {t('wrongCount', { count: wrongCount })}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {topicT(question.topic)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <BookmarkButton questionId={question.id} />
          {isExpanded ? (
            <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {question.code != null && <CodeBlock code={question.code} />}

              <div className="space-y-1.5">
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`text-sm px-3 py-2 rounded-lg ${
                      idx === question.correctIndex
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {question.explanation}
              </p>

              <a
                href={question.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={quizT('viewSourceNewTab')}
                className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {quizT('viewSource')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function WrongAnswersPage() {
  const router = useRouter()
  const t = useTranslations('wrongAnswers')
  const tc = useTranslations('common')
  const topicT = useTranslations('topics')
  const isHydrated = useHydration()
  const sessions = useProgressStore((s) => s.sessions)
  const startSession = useSessionStore((s) => s.startSession)
  const resetSession = useSessionStore((s) => s.reset)
  const enabledTopics = useTopicFilterStore((s) => s.enabledTopics)
  const topicFilter = createTopicFilter(enabledTopics)

  const wrongEntries = useMemo(
    () => extractWrongAnswers(sessions, topicFilter),
    [sessions, topicFilter],
  )

  const topicGroups = useMemo(
    () => groupWrongAnswersByTopic(wrongEntries),
    [wrongEntries],
  )

  const handleRetryAll = useCallback(() => {
    const limited = wrongEntries.slice(0, SESSION_LIMIT)
    const sessionQuestions = generateWrongAnswerSession(limited)
    if (sessionQuestions.length === 0) return
    resetSession()
    startSession([...sessionQuestions])
    router.push('/session')
  }, [wrongEntries, resetSession, startSession, router])

  if (isHydrated === false) {
    return <WrongAnswersSkeleton />
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
          <FileX2 size={22} className="text-red-500" />
          {t('title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {wrongEntries.length > 0
            ? t('subtitle', { count: wrongEntries.length })
            : t('empty')}
        </p>
      </header>

      {wrongEntries.length === 0 ? (
        <div className="text-center py-16">
          <FileX2 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('empty')}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleRetryAll}
            className="w-full mb-6 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            aria-label={t('retryAll')}
          >
            <RotateCcw size={16} />
            {t('retryAllButton', { count: Math.min(wrongEntries.length, SESSION_LIMIT) })}
          </button>

          <div className="space-y-6">
            {topicGroups.map((group, groupIndex) => (
              <motion.section
                key={group.topic}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * ANIMATION_DELAY_STEP }}
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
    </div>
  )
}

function WrongAnswersSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
