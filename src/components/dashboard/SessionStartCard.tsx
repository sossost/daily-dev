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
      <div className="relative">
        <Link
          href="/session"
          className="block bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <h2 className="text-xl font-bold mb-1">학습 시작</h2>
          <p className="text-sm text-blue-100">
            {isFiltered
              ? `${enabledCount}/${TOPICS.length}개 토픽 선택됨`
              : '5분이면 충분합니다'}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`absolute top-3 right-3 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isFiltered
              ? 'bg-white/30 hover:bg-white/40'
              : 'bg-white/10 hover:bg-white/20'
          }`}
          aria-label="토픽 필터 설정"
        >
          <Filter size={16} className="text-white" />
        </button>
      </div>
      <TopicFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  )
}
