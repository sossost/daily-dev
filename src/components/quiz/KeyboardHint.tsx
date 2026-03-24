'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard } from 'lucide-react'

const DISMISS_STORAGE_KEY = 'daily-dev-keyboard-hint-dismissed'
const HINT_DISPLAY_COUNT_KEY = 'daily-dev-keyboard-hint-count'
const MAX_DISPLAY_COUNT = 3

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === 'true'
  } catch {
    return true
  }
}

function getDisplayCount(): number {
  if (typeof window === 'undefined') return MAX_DISPLAY_COUNT
  try {
    const count = localStorage.getItem(HINT_DISPLAY_COUNT_KEY)
    return count != null ? Number(count) : 0
  } catch {
    return MAX_DISPLAY_COUNT
  }
}

function incrementDisplayCount(): void {
  try {
    const current = getDisplayCount()
    localStorage.setItem(HINT_DISPLAY_COUNT_KEY, String(current + 1))
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function KeyboardHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show on devices likely to have a keyboard
    try {
      const hasPointer = window.matchMedia('(pointer: fine)').matches
      if (!hasPointer) return
    } catch {
      return
    }

    if (isDismissed()) return
    if (getDisplayCount() >= MAX_DISPLAY_COUNT) return

    setVisible(true)
    incrementDisplayCount()
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true')
    } catch {
      // localStorage unavailable — silently skip
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mb-4 flex items-center gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-3"
        >
          <Keyboard size={16} className="shrink-0 text-blue-500 dark:text-blue-400" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <span className="font-medium">키보드 단축키:</span>{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-mono text-[11px]">1</kbd>
            –
            <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-mono text-[11px]">4</kbd>
            {' '}답변 선택 ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-mono text-[11px]">Enter</kbd>
            {' '}다음
          </p>
          <button
            onClick={handleDismiss}
            className="ml-auto shrink-0 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="단축키 안내 닫기"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
