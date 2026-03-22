'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { ResultSummary } from '@/components/result/ResultSummary'
import { ReviewSchedule } from '@/components/result/ReviewSchedule'

export default function ResultPage() {
  const answers = useSessionStore((s) => s.answers)
  const reset = useSessionStore((s) => s.reset)
  const updateAfterSession = useProgressStore((s) => s.updateAfterSession)
  const hasUpdated = useRef(false)

  const correctCount = answers.filter((a) => a.isCorrect === true).length
  const incorrectCount = answers.filter((a) => a.isCorrect === false).length
  const totalCount = answers.length

  useEffect(() => {
    if (answers.length === 0) {
      return
    }
    if (hasUpdated.current === true) {
      return
    }

    hasUpdated.current = true
    updateAfterSession(answers)
  }, [answers, updateAfterSession])

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  if (answers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">세션 데이터가 없습니다.</p>
        <Link
          href="/"
          className="inline-block mt-4 text-blue-500 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div>
      <ResultSummary
        correct={correctCount}
        incorrect={incorrectCount}
        total={totalCount}
      />
      <ReviewSchedule incorrectCount={incorrectCount} />
      <Link
        href="/"
        className="block mt-6 text-center py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
