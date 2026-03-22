'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

interface SessionStartCardProps {
  completedToday: boolean
}

export function SessionStartCard({ completedToday }: SessionStartCardProps) {
  if (completedToday) {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">
          오늘의 학습 완료!
        </h2>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          내일 다시 도전해보세요
        </p>
      </div>
    )
  }

  return (
    <Link
      href="/session"
      className="block bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
    >
      <h2 className="text-xl font-bold mb-1">오늘의 학습 시작</h2>
      <p className="text-sm text-blue-100">
        5분이면 충분합니다
      </p>
    </Link>
  )
}
