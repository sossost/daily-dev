/**
 * Progress store — user learning data.
 * No localStorage persist — data is loaded from Supabase via server injection.
 * Zustand serves as an in-memory cache only.
 * updateAfterSession() recalculates SRS intervals, topic stats, and streaks.
 */
import { create } from 'zustand'
import type { SessionAnswer, SessionRecord, Topic, UserProgress } from '@/types'
import { DEFAULT_USER_PROGRESS, TOPICS } from '@/types'
import { calculateSRS, createInitialSRS } from '@/lib/srs'
import { getToday } from '@/lib/date'
import { getCurrentUserId } from '@/lib/supabase/currentUser'
import { syncAfterSession } from '@/lib/supabase/syncSession'

interface ProgressState extends UserProgress {
  updateAfterSession: (answers: SessionAnswer[]) => Promise<void>
  reset: () => void
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  ...DEFAULT_USER_PROGRESS,

  reset: () => {
    set({ ...DEFAULT_USER_PROGRESS })
  },

  updateAfterSession: async (answers) => {
    const state = get()
    const today = getToday()

    const correctCount = answers.filter((a) => a.isCorrect).length

    // Update SRS records
    const updatedSrsRecords = { ...state.srsRecords }
    for (const answer of answers) {
      const existing = updatedSrsRecords[answer.questionId]
      if (existing != null) {
        updatedSrsRecords[answer.questionId] = calculateSRS(
          existing,
          answer.isCorrect,
          today,
        )
      } else {
        const initial = createInitialSRS(answer.questionId, today)
        updatedSrsRecords[answer.questionId] = answer.isCorrect
          ? calculateSRS(initial, true, today)
          : initial
      }
    }

    // Update topic stats
    const updatedTopicStats = { ...state.topicStats }
    for (const topic of TOPICS) {
      updatedTopicStats[topic] = { ...state.topicStats[topic] }
    }

    for (const answer of answers) {
      const topic: Topic = answer.topic
      const stat = updatedTopicStats[topic]
      const totalAnswered = stat.totalAnswered + 1
      const correctAnswers = stat.correctAnswers + (answer.isCorrect ? 1 : 0)
      const PERCENTAGE_MULTIPLIER = 100

      updatedTopicStats[topic] = {
        ...stat,
        totalAnswered,
        correctAnswers,
        accuracy: Math.round((correctAnswers / totalAnswered) * PERCENTAGE_MULTIPLIER),
      }
    }

    // Update streak
    const isConsecutiveDay =
      state.lastSessionDate === today ||
      state.lastSessionDate === getYesterday(today)
    const currentStreak = isConsecutiveDay
      ? state.currentStreak + (state.lastSessionDate === today ? 0 : 1)
      : 1
    const longestStreak = Math.max(state.longestStreak, currentStreak)

    // Create session record
    const totalTimeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0)
    const sessionRecord: SessionRecord = {
      id: crypto.randomUUID(),
      date: today,
      answers,
      score: correctCount,
      totalQuestions: answers.length,
      duration: totalTimeSpent,
    }

    set({
      totalSessions: state.totalSessions + 1,
      totalCorrect: state.totalCorrect + correctCount,
      totalAnswered: state.totalAnswered + answers.length,
      currentStreak,
      longestStreak,
      lastSessionDate: today,
      topicStats: updatedTopicStats,
      srsRecords: updatedSrsRecords,
      sessions: [...state.sessions, sessionRecord],
    })

    // Sync to Supabase — caller can await to ensure server is up-to-date
    const userId = getCurrentUserId()
    if (userId != null) {
      await syncAfterSession(
        sessionRecord,
        answers,
        updatedSrsRecords,
        updatedTopicStats,
        { correct: correctCount, answered: answers.length, current_streak: currentStreak, date: today },
      ).catch(() => {
        // Sync failed — data persists in Zustand, will retry on next session
      })
    }
  },
}))

function getYesterday(today: string): string {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
