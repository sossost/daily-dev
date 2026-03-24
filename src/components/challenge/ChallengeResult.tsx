'use client'

import { motion } from 'framer-motion'
import { Trophy, Zap, Target, Clock } from 'lucide-react'
import type { ChallengeResult as ChallengeResultData } from '@/lib/challenge-session'
import { CHALLENGE_DURATION_LABELS } from '@/lib/challenge-session'

const ANIMATION_DELAY_STEP = 0.08
const HIGH_ACCURACY = 80
const MEDIUM_ACCURACY = 60

interface ChallengeResultProps {
  readonly result: ChallengeResultData
  readonly onRetry: () => void
  readonly onHome: () => void
}

function getGradeInfo(accuracy: number): { label: string; color: string } {
  if (accuracy >= HIGH_ACCURACY) return { label: '훌륭해요!', color: 'text-emerald-500' }
  if (accuracy >= MEDIUM_ACCURACY) return { label: '좋아요!', color: 'text-blue-500' }
  return { label: '계속 도전하세요!', color: 'text-amber-500' }
}

export function ChallengeResult({ result, onRetry, onHome }: ChallengeResultProps) {
  const grade = getGradeInfo(result.accuracy)

  const stats = [
    {
      icon: Target,
      label: '정답률',
      value: `${result.accuracy}%`,
      color: 'text-blue-500',
    },
    {
      icon: Zap,
      label: '총 문제',
      value: `${result.totalAnswered}개`,
      color: 'text-amber-500',
    },
    {
      icon: Trophy,
      label: '정답',
      value: `${result.correctCount}개`,
      color: 'text-emerald-500',
    },
    {
      icon: Clock,
      label: '속도',
      value: `${result.questionsPerMinute}/분`,
      color: 'text-purple-500',
    },
  ] as const

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6"
      >
        <p className={`text-2xl font-bold ${grade.color}`}>{grade.label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {CHALLENGE_DURATION_LABELS[result.duration]} 챌린지 완료
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * ANIMATION_DELAY_STEP }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4"
          >
            <stat.icon size={18} className={`${stat.color} mx-auto mb-2`} />
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full py-3 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-colors"
        >
          다시 도전
        </button>
        <button
          type="button"
          onClick={onHome}
          className="w-full py-3 rounded-xl font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
