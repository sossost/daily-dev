'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

const TIMER_INTERVAL_MS = 100
const MILLISECONDS_PER_SECOND = 1000
const LOW_TIME_THRESHOLD = 10
const PERCENTAGE_MULTIPLIER = 100

interface ChallengeTimerProps {
  readonly durationSeconds: number
  readonly isRunning: boolean
  readonly onTimeUp: () => void
}

export function ChallengeTimer({ durationSeconds, isRunning, onTimeUp }: ChallengeTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const onTimeUpRef = useRef(onTimeUp)
  onTimeUpRef.current = onTimeUp

  const startTimeRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (startTimeRef.current == null) return

    const elapsed = (Date.now() - startTimeRef.current) / MILLISECONDS_PER_SECOND
    const newRemaining = Math.max(0, durationSeconds - elapsed)
    setRemaining(newRemaining)

    if (newRemaining <= 0) {
      onTimeUpRef.current()
    }
  }, [durationSeconds])

  useEffect(() => {
    if (!isRunning) {
      setRemaining(durationSeconds)
      startTimeRef.current = null
      return
    }

    startTimeRef.current = Date.now()
    const interval = setInterval(tick, TIMER_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isRunning, durationSeconds, tick])

  const seconds = Math.ceil(remaining)
  const progress = remaining / durationSeconds
  const isLowTime = seconds <= LOW_TIME_THRESHOLD

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isLowTime ? 'bg-red-500' : 'bg-emerald-500'}`}
          initial={{ width: `${PERCENTAGE_MULTIPLIER}%` }}
          animate={{ width: `${progress * PERCENTAGE_MULTIPLIER}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <span
        className={`text-lg font-bold tabular-nums min-w-[3ch] text-right ${
          isLowTime ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'
        }`}
        aria-label={`남은 시간 ${seconds}초`}
        role="timer"
      >
        {seconds}
      </span>
    </div>
  )
}
