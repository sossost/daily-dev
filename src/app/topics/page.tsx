'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useProgressStore } from '@/stores/useProgressStore'
import { TopicProgressList } from '@/components/dashboard/TopicProgressList'

export default function TopicsPage() {
  const topicStats = useProgressStore((s) => s.topicStats)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">토픽 목록</h1>
      </div>
      <TopicProgressList topicStats={topicStats} />
    </div>
  )
}
