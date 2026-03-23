import { useEffect, useCallback } from 'react'

const OPTION_COUNT = 4
const DIGIT_KEY_OFFSET = 1

interface UseQuizKeyboardOptions {
  readonly isAnswered: boolean
  readonly onSelect: (index: number) => void
  readonly onNext: () => void
}

/**
 * Keyboard shortcuts for quiz sessions.
 * - Press 1–4 to select an answer option
 * - Press Enter or Space to advance to the next question (after answering)
 */
export function useQuizKeyboard({
  isAnswered,
  onSelect,
  onNext,
}: UseQuizKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Number keys 1–4 select answer options
      const digitIndex = Number(event.key) - DIGIT_KEY_OFFSET
      if (digitIndex >= 0 && digitIndex < OPTION_COUNT && !isAnswered) {
        event.preventDefault()
        onSelect(digitIndex)
        return
      }

      // Enter or Space to advance
      if ((event.key === 'Enter' || event.key === ' ') && isAnswered) {
        event.preventDefault()
        onNext()
      }
    },
    [isAnswered, onSelect, onNext],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
