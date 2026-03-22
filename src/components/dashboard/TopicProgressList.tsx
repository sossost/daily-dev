'use client'

import type { Topic, TopicStat } from '@/types'
import { TOPICS, TOPIC_LABELS } from '@/types'
import { getTopicQuestionCounts } from '@/lib/questions'

const TOPIC_COLORS: Record<Topic, string> = {
  scope: 'bg-rose-500',
  closure: 'bg-orange-500',
  prototype: 'bg-amber-500',
  this: 'bg-emerald-500',
  'event-loop': 'bg-cyan-500',
  async: 'bg-blue-500',
  'type-coercion': 'bg-violet-500',
}

interface TopicProgressListProps {
  topicStats: Record<Topic, TopicStat>
}

export function TopicProgressList({ topicStats }: TopicProgressListProps) {
  const topicCounts = getTopicQuestionCounts()
  const PERCENTAGE_MULTIPLIER = 100

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        토픽별 진행률
      </h3>
      <div className="flex flex-col gap-4">
        {TOPICS.map((topic) => {
          const stat = topicStats[topic]
          const total = topicCounts[topic] ?? 0
          const attempted = stat.totalAnswered
          const percentage =
            total > 0
              ? Math.round((attempted / total) * PERCENTAGE_MULTIPLIER)
              : 0

          return (
            <div key={topic} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-800">
                  {TOPIC_LABELS[topic]}
                </span>
                <span className="text-xs text-gray-500">
                  {attempted}/{total} ({stat.accuracy}% 정답률)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${TOPIC_COLORS[topic]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
