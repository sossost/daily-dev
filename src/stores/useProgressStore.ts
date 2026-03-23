/**
 * Progress store — persistent user learning data.
 * Stores SRS records, topic accuracy stats, streak counts, and session history.
 * Persisted to localStorage (permanent across sessions).
 * updateAfterSession() recalculates SRS intervals, topic stats, and streaks.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionAnswer, SessionRecord, Topic, UserProgress } from '@/types'
import { DEFAULT_USER_PROGRESS, TOPICS } from '@/types'
import { calculateSRS, createInitialSRS } from '@/lib/srs'
import { getToday } from '@/lib/date'

interface ProgressState extends UserProgress {
  updateAfterSession: (answers: SessionAnswer[]) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER_PROGRESS,

      updateAfterSession: (answers) => {
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
          id: `session-${Date.now()}`,
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
      },

    }),
    {
      name: 'daily-dev-progress',
    },
  ),
)

function getYesterday(today: string): string {
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
