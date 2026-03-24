'use client'

import type { Topic, TopicStat } from '@/types'
import { CATEGORIES_WITH_FALLBACK, TOPIC_LABELS } from '@/types'
import { getTopicQuestionCounts } from '@/lib/questions'
import { CategoryAccordion } from '@/components/common/CategoryAccordion'

const TOPIC_COLORS: Record<Topic, string> = {
  scope: 'bg-rose-500',
  closure: 'bg-orange-500',
  prototype: 'bg-amber-500',
  this: 'bg-emerald-500',
  'event-loop': 'bg-cyan-500',
  async: 'bg-blue-500',
  'type-coercion': 'bg-violet-500',
  typescript: 'bg-indigo-500',
  promise: 'bg-pink-500',
  'dom-manipulation': 'bg-teal-500',
  'css-layout': 'bg-lime-500',
  'web-performance': 'bg-sky-500',
  'react-basics': 'bg-red-500',
  'data-structures': 'bg-fuchsia-500',
  'design-patterns': 'bg-yellow-500',
  network: 'bg-slate-500',
  algorithms: 'bg-purple-500',
}

const PERCENTAGE_MULTIPLIER = 100

interface TopicProgressListProps {
  readonly topicStats: Record<Topic, TopicStat>
}

export function TopicProgressList({ topicStats }: TopicProgressListProps) {
  const topicCounts = getTopicQuestionCounts()
  const categories = CATEGORIES_WITH_FALLBACK

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        토픽별 진행률
      </h3>
      <div className="flex flex-col gap-6">
        {categories.map((category) => (
          <CategoryAccordion key={category.id} category={category}>
            <div className="flex flex-col gap-3">
              {category.topics.map((topic) => {
                const stat = topicStats[topic]
                const total = topicCounts[topic] ?? 0
                const attempted = stat.totalAnswered
                const percentage =
                  total > 0
                    ? Math.round((attempted / total) * PERCENTAGE_MULTIPLIER)
                    : 0

                return (
                  <div
                    key={topic}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {TOPIC_LABELS[topic]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {attempted}/{total} ({stat.accuracy}% 정답률)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${TOPIC_COLORS[topic]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CategoryAccordion>
        ))}
      </div>
    </div>
  )
}
