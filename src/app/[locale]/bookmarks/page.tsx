'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { isLocale } from '@/i18n/routing'
import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useHydration } from '@/hooks/useHydration'
import { getQuestionById } from '@/lib/questions'
import type { Question, Topic } from '@/types'
import { BookmarkButton } from '@/components/quiz/BookmarkButton'
import { CodeBlock } from '@/components/quiz/CodeBlock'

function groupByTopic(questions: Question[]): Record<string, Question[]> {
  const grouped: Record<string, Question[]> = {}
  for (const q of questions) {
    const topic = q.topic
    if (grouped[topic] == null) {
      grouped[topic] = []
    }
    grouped[topic].push(q)
  }
  return grouped
}

function BookmarkedQuestionCard({ question }: { question: Question }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('bookmarks')

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
                className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('viewSource')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function BookmarksPage() {
  const t = useTranslations('bookmarks')
  const tc = useTranslations('common')
  const tt = useTranslations('topics')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const bookmarkedIds = useBookmarkStore((s) => s.bookmarkedIds)

  if (isHydrated === false) {
    return <BookmarksSkeleton />
  }

  const questions = bookmarkedIds
    .map((id) => getQuestionById(id, locale))
    .filter((q): q is Question => q != null)

  const grouped = groupByTopic(questions)
  const topicKeys = Object.keys(grouped) as Topic[]

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={tc('home')}
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {questions.length > 0
              ? t('count', { count: questions.length })
              : t('empty')}
          </p>
        </div>
      </header>

      {questions.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topicKeys.map((topic) => (
            <section key={topic}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {tt(topic)}
              </h2>
              <div className="space-y-2">
                {grouped[topic].map((question) => (
                  <BookmarkedQuestionCard key={question.id} question={question} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function BookmarksSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div>
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
