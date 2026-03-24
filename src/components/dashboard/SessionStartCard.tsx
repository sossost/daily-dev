'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Filter } from 'lucide-react'
import { TOPICS } from '@/types'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { TopicFilterModal } from '@/components/dashboard/TopicFilterModal'

export function SessionStartCard() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const enabledCount = useTopicFilterStore((s) => s.enabledTopics.length)
  const isFiltered = enabledCount < TOPICS.length

  return (
    <>
      <div className="flex gap-2">
        <Link
          href="/session"
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <h2 className="text-xl font-bold mb-1">학습 시작</h2>
          <p className="text-sm text-blue-100">
            {isFiltered
              ? `${enabledCount}/${TOPICS.length}개 토픽`
              : '5분이면 충분합니다'}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`flex flex-col items-center justify-center w-16 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            isFiltered
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="토픽 필터 설정"
        >
          <Filter size={20} />
          <span className="text-[10px] font-medium mt-1">필터</span>
        </button>
      </div>
      <TopicFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  )
}
