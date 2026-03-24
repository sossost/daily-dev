'use client'

import { useState } from 'react'
import { Share2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { shareResult } from '@/lib/share'

interface ShareButtonProps {
  correct: number
  total: number
}

export function ShareButton({ correct, total }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = await shareResult(correct, total)

      if (result === 'copied') {
        toast.success('클립보드에 복사되었습니다', { icon: <Check size={16} /> })
      } else if (result === 'failed') {
        toast.error('복사에 실패했습니다', { icon: <X size={16} /> })
      }
      // 'shared' and 'cancelled' — no toast needed
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      aria-busy={isSharing}
      className="flex items-center justify-center gap-2 w-full mt-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50"
      aria-label="결과 공유하기"
    >
      <Share2 size={18} />
      결과 공유하기
    </button>
  )
}
