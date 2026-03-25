'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { DayReviewCount } from '@/lib/srs-schedule'

const ANIMATION_DELAY_STEP = 0.04
const BAR_MAX_HEIGHT = 100
const PERCENTAGE_MULTIPLIER = 100

interface ReviewTimelineProps {
  readonly reviews: readonly DayReviewCount[]
}

export function ReviewTimeline({ reviews }: ReviewTimelineProps) {
  const t = useTranslations('schedule')
  const maxCount = Math.max(1, ...reviews.map((r) => r.count))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
      <div
        className="flex items-end gap-1 justify-between"
        style={{ height: BAR_MAX_HEIGHT + 32 }}
        role="img"
        aria-label={t('reviewTimeline')}
      >
        {reviews.map((day, i) => {
          const height =
            day.count === 0
              ? 2
              : Math.max(8, (day.count / maxCount) * BAR_MAX_HEIGHT)
          const intensity = day.count === 0
            ? 'bg-gray-200 dark:bg-gray-700'
            : day.isToday
              ? 'bg-blue-500 dark:bg-blue-400'
              : getIntensityColor(day.count, maxCount)

          return (
            <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              {day.count > 0 && (
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                  {day.count}
                </span>
              )}
              <motion.div
                className={`w-full max-w-[24px] rounded-t-sm ${intensity}`}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{
                  duration: 0.4,
                  delay: i * ANIMATION_DELAY_STEP,
                  ease: 'easeOut',
                }}
                aria-label={t('dayCount', { label: day.label, count: day.count })}
              />
              <span className="text-[8px] text-gray-400 dark:text-gray-500 truncate w-full text-center leading-tight">
                {day.label.length > 3 ? day.label.split(' ')[0] : day.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getIntensityColor(count: number, max: number): string {
  const ratio = (count / max) * PERCENTAGE_MULTIPLIER
  const HIGH_THRESHOLD = 70
  const MEDIUM_THRESHOLD = 40
  if (ratio >= HIGH_THRESHOLD) return 'bg-violet-500 dark:bg-violet-400'
  if (ratio >= MEDIUM_THRESHOLD) return 'bg-violet-400 dark:bg-violet-300'
  return 'bg-violet-300 dark:bg-violet-200'
}
