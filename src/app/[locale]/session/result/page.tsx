'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useSessionStore } from '@/stores/useSessionStore'
import { useProgressStore } from '@/stores/useProgressStore'
import { useHydration } from '@/hooks/useHydration'
import { ResultSummary } from '@/components/result/ResultSummary'
import { ReviewSchedule } from '@/components/result/ReviewSchedule'
import { AnswerReviewList } from '@/components/result/AnswerReviewList'
import { ShareButton } from '@/components/result/ShareButton'
import { RetryWrongButton } from '@/components/result/RetryWrongButton'
import { LoginNudge } from '@/components/result/LoginNudge'

const UPDATED_SESSION_KEY = 'daily-dev-last-updated-session'

export default function ResultPage() {
  const t = useTranslations('result')
  const router = useRouter()
  const isHydrated = useHydration()
  const questions = useSessionStore((s) => s.questions)
  const answers = useSessionStore((s) => s.answers)
  const startTime = useSessionStore((s) => s.startTime)
  const updateAfterSession = useProgressStore((s) => s.updateAfterSession)

  const correctCount = answers.filter((a) => a.isCorrect === true).length
  const incorrectCount = answers.filter((a) => a.isCorrect === false).length
  const totalCount = answers.length

  useEffect(() => {
    if (isHydrated === false || answers.length === 0 || startTime == null) {
      return
    }

    // Idempotency guard: prevent double-update in React Strict Mode
    // Uses startTime as a unique session identifier
    const sessionId = String(startTime)
    try {
      const lastUpdated = sessionStorage.getItem(UPDATED_SESSION_KEY)
      if (lastUpdated === sessionId) {
        return
      }
      sessionStorage.setItem(UPDATED_SESSION_KEY, sessionId)
    } catch {
      // sessionStorage unavailable — proceed (worst case: double update on remount)
    }

    updateAfterSession(answers).then(() => {
      router.refresh()
    })
  }, [isHydrated, answers, startTime, updateAfterSession, router])

  if (isHydrated === false) {
    return null
  }

  if (answers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t('noSessionData')}</p>
        <Link
          href="/"
          className="inline-block mt-4 text-blue-500 dark:text-blue-400 hover:underline"
        >
          {t('backHome')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <ResultSummary
        correct={correctCount}
        incorrect={incorrectCount}
        total={totalCount}
      />
      <ReviewSchedule incorrectCount={incorrectCount} />
      <AnswerReviewList questions={questions} answers={answers} />
      <ShareButton correct={correctCount} total={totalCount} />
      <RetryWrongButton questions={questions} answers={answers} />
      <LoginNudge />
      <Link
        href="/"
        className="block mt-6 text-center py-3 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
