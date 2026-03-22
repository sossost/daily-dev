'use client'

import { Calendar } from 'lucide-react'

interface ReviewScheduleProps {
  incorrectCount: number
}

export function ReviewSchedule({ incorrectCount }: ReviewScheduleProps) {
  if (incorrectCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mt-6">
        <p className="text-green-800 font-semibold">
          모든 문제를 맞혔습니다! 완벽해요!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-2">
        <Calendar className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">복습 예정</h3>
      </div>
      <p className="text-sm text-amber-700">
        틀린 {incorrectCount}문제가 내일 복습 목록에 추가되었습니다.
        반복 학습으로 기억을 강화하세요!
      </p>
    </div>
  )
}
