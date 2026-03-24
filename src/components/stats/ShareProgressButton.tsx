'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, X, Check } from 'lucide-react'
import type { Topic, TopicStat } from '@/types'
import {
  renderProgressCard,
  downloadCanvasAsImage,
  shareCanvasImage,
  type ProgressCardData,
} from '@/lib/progress-card'

interface ShareProgressButtonProps {
  readonly overallAccuracy: number
  readonly totalSessions: number
  readonly currentStreak: number
  readonly longestStreak: number
  readonly totalAnswered: number
  readonly topicStats: Record<Topic, TopicStat>
}

type FeedbackState = 'idle' | 'shared' | 'downloaded'

const FEEDBACK_DURATION_MS = 2000

export function ShareProgressButton({
  overallAccuracy,
  totalSessions,
  currentStreak,
  longestStreak,
  totalAnswered,
  topicStats,
}: ShareProgressButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cardData: ProgressCardData = {
    overallAccuracy,
    totalSessions,
    currentStreak,
    longestStreak,
    totalAnswered,
    topicStats,
  }

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setFeedback('idle')
    // Render card after modal opens (next frame)
    requestAnimationFrame(() => {
      if (canvasRef.current != null) {
        renderProgressCard(canvasRef.current, cardData)
      }
    })
  }, [cardData])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setFeedback('idle')
  }, [])

  const showFeedback = useCallback((state: FeedbackState) => {
    if (feedbackTimerRef.current != null) {
      clearTimeout(feedbackTimerRef.current)
    }
    setFeedback(state)
    feedbackTimerRef.current = setTimeout(() => setFeedback('idle'), FEEDBACK_DURATION_MS)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current != null) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (canvasRef.current == null) return
    downloadCanvasAsImage(canvasRef.current, 'dailydev-progress.png')
    showFeedback('downloaded')
  }, [showFeedback])

  const handleShare = useCallback(async () => {
    if (canvasRef.current == null) return
    const shared = await shareCanvasImage(canvasRef.current)
    if (shared) {
      showFeedback('shared')
    } else {
      // Fallback to download if sharing is not supported
      handleDownload()
    }
  }, [showFeedback, handleDownload])

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
        aria-label="학습 성과 공유하기"
      >
        <Share2 size={16} />
        공유하기
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="학습 성과 카드"
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  학습 성과 카드
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="닫기"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="p-4 flex justify-center overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  className="rounded-xl max-w-full h-auto"
                  style={{ imageRendering: 'auto' }}
                />
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  이미지 저장
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Share2 size={16} />
                  공유하기
                </button>
              </div>

              <AnimatePresence>
                {feedback !== 'idle' && (
                  <motion.div
                    className="px-4 pb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
                      <Check size={14} />
                      {feedback === 'shared' ? '공유되었습니다' : '이미지가 저장되었습니다'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
