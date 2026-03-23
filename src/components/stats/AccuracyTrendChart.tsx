'use client'

import { motion } from 'framer-motion'
import type { AccuracyPoint } from '@/lib/stats'

const BAR_MAX_HEIGHT = 120
const PERCENTAGE_MULTIPLIER = 100
const ANIMATION_DELAY_STEP = 0.05

interface AccuracyTrendChartProps {
  readonly trend: readonly AccuracyPoint[]
}

export function AccuracyTrendChart({ trend }: AccuracyTrendChartProps) {
  if (trend.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        세션을 완료하면 정답률 추이가 표시됩니다
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-end gap-1.5 justify-center" style={{ height: BAR_MAX_HEIGHT + 24 }}>
        {trend.map((point, i) => {
          const height = Math.max(4, (point.accuracy / PERCENTAGE_MULTIPLIER) * BAR_MAX_HEIGHT)
          const isGood = point.accuracy >= 70
          const barColor = isGood
            ? 'bg-emerald-500 dark:bg-emerald-400'
            : 'bg-amber-500 dark:bg-amber-400'

          return (
            <div key={point.sessionIndex} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                {point.accuracy}%
              </span>
              <motion.div
                className={`w-6 rounded-t-sm ${barColor}`}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.4, delay: i * ANIMATION_DELAY_STEP, ease: 'easeOut' }}
                aria-label={`세션 ${point.sessionIndex}: ${point.score}/${point.total} (${point.accuracy}%)`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-500">
        <span>이전</span>
        <span>최근</span>
      </div>
    </div>
  )
}
