'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudUpload } from 'lucide-react'
import { getIsAuthenticated } from '@/lib/supabase/currentUser'
import { LoginModal } from '@/components/LoginModal'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'daily-dev-login-nudge-dismissed'
const COUNT_KEY = 'daily-dev-login-nudge-count'
const MAX_DISPLAY_COUNT = 3

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return true
  }
}

function getDisplayCount(): number {
  if (typeof window === 'undefined') return MAX_DISPLAY_COUNT
  try {
    const count = localStorage.getItem(COUNT_KEY)
    return count != null ? Number(count) : 0
  } catch {
    return MAX_DISPLAY_COUNT
  }
}

function incrementDisplayCount(): void {
  try {
    const current = getDisplayCount()
    localStorage.setItem(COUNT_KEY, String(current + 1))
  } catch {
    // localStorage unavailable
  }
}

export function LoginNudge() {
  const [visible, setVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { signInWithGoogle, signInWithGitHub } = useAuth()

  useEffect(() => {
    if (getIsAuthenticated()) return
    if (isDismissed()) return
    if (getDisplayCount() >= MAX_DISPLAY_COUNT) return

    setVisible(true)
    incrementDisplayCount()
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, 'true')
    } catch {
      // localStorage unavailable
    }
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <CloudUpload size={16} className="shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  로그인하면 다른 기기에서도 학습 기록을 이어갈 수 있어요
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                >
                  로그인하기 →
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-300 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                aria-label="로그인 안내 닫기"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoogle={signInWithGoogle}
        onGitHub={signInWithGitHub}
      />
    </>
  )
}
