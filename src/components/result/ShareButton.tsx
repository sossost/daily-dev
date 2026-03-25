'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Share2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { shareResult } from '@/lib/share'

interface ShareButtonProps {
  correct: number
  total: number
}

export function ShareButton({ correct, total }: ShareButtonProps) {
  const t = useTranslations('result')
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = await shareResult(correct, total)

      if (result === 'copied') {
        toast.success(t('copied'), { icon: <Check size={16} /> })
      } else if (result === 'failed') {
        toast.error(t('copyFailed'), { icon: <X size={16} /> })
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
      aria-label={t('share')}
    >
      <Share2 size={18} />
      {t('share')}
    </button>
  )
}
