'use client'

import { motion } from 'framer-motion'
import type { Topic, TopicStat } from '@/types'
import { TOPICS, TOPIC_LABELS } from '@/types'

const ANIMATION_DELAY_STEP = 0.04

interface TopicAccuracyBarsProps {
  readonly topicStats: Record<Topic, TopicStat>
}

export function TopicAccuracyBars({ topicStats }: TopicAccuracyBarsProps) {
  const attempted = TOPICS
    .filter((topic) => topicStats[topic].totalAnswered > 0)
    .map((topic) => ({
      topic,
      label: TOPIC_LABELS[topic],
      accuracy: topicStats[topic].accuracy,
      totalAnswered: topicStats[topic].totalAnswered,
    }))
    .sort((a, b) => b.accuracy - a.accuracy)

  if (attempted.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        토픽별 정답률을 보려면 학습을 시작하세요
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {attempted.map((item, i) => (
        <div key={item.topic} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 dark:text-gray-400 w-24 shrink-0 truncate text-right">
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full rounded-full ${getBarColor(item.accuracy)}`}
              initial={{ width: 0 }}
              animate={{ width: `${item.accuracy}%` }}
              transition={{ duration: 0.5, delay: i * ANIMATION_DELAY_STEP, ease: 'easeOut' }}
            />
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
              {item.accuracy}%
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

const HIGH_ACCURACY = 80
const MEDIUM_ACCURACY = 60

function getBarColor(accuracy: number): string {
  if (accuracy >= HIGH_ACCURACY) return 'bg-emerald-500 dark:bg-emerald-400'
  if (accuracy >= MEDIUM_ACCURACY) return 'bg-blue-500 dark:bg-blue-400'
  return 'bg-amber-500 dark:bg-amber-400'
}
