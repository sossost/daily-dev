'use client'

import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { isLocale } from '@/i18n/routing'
import { TOPICS, type Topic } from '@/types'
import { getQuestionsByTopic } from '@/lib/questions'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { SampleQuestion } from '@/components/topics/SampleQuestion'

const SAMPLE_COUNT = 3

function isValidTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value)
}

export default function TopicDetailPage() {
  const params = useParams()
  const rawTopic = params.topic
  const topic = Array.isArray(rawTopic) ? rawTopic[0] : rawTopic
  const t = useTranslations('topics')
  const td = useTranslations('topics.detail')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const isHydrated = useHydration()
  const topicStats = useProgressStore((s) => s.topicStats)
  const descriptionKey = `description.${topic}` as const
  const hasDescription = td.has(descriptionKey)

  if (topic == null || !isValidTopic(topic)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Topic not found</p>
        <Link
          href="/topics"
          className="text-blue-500 hover:underline mt-2 inline-block"
        >
          {td('allTopics')}
        </Link>
      </div>
    )
  }

  const questions = getQuestionsByTopic(topic, locale)
  const stat = topicStats[topic] ?? null
  const hasStat = isHydrated && stat != null && stat.totalAnswered > 0
  const easyCount = questions.filter((q) => q.difficulty === 'easy').length
  const mediumCount = questions.filter((q) => q.difficulty === 'medium').length
  const hardCount = questions.filter((q) => q.difficulty === 'hard').length
  const sampleQuestions = questions.slice(0, SAMPLE_COUNT)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/topics"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={td('allTopics')}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t(topic)}
          </h1>
        </div>
      </div>

      {hasDescription && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {td(descriptionKey)}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {questions.length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {td('totalQuestions')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          <div className="flex justify-center gap-1 text-xs mb-1">
            <span className="text-green-500">{easyCount}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-yellow-500">{mediumCount}</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-red-500">{hardCount}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {td('difficulty')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
          {hasStat ? (
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stat.accuracy}%
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {hasStat
              ? td('myAccuracy')
              : td('notAttempted')}
          </p>
        </div>
      </div>

      {/* Sample Questions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {td('sampleQuestions')}
        </h2>
        <div className="flex flex-col gap-3">
          {sampleQuestions.map((question) => (
            <SampleQuestion key={question.id} question={question} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/practice?topic=${topic}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          <Dumbbell size={18} />
          {td('practiceThis')}
        </Link>
        <Link
          href="/topics"
          className="text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {td('allTopics')}
        </Link>
      </div>
    </div>
  )
}
