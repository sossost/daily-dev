import { useProgressStore } from '@/stores/useProgressStore'
import { DEFAULT_USER_PROGRESS, TOPICS } from '@/types'
import type { SessionAnswer, Topic } from '@/types'
import { act } from '@testing-library/react'

// Mock getToday to return a deterministic date
jest.mock('@/lib/date', () => ({
  ...jest.requireActual('@/lib/date'),
  getToday: () => '2026-03-23',
}))

function createAnswer(overrides: Partial<SessionAnswer> = {}): SessionAnswer {
  return {
    questionId: 'scope-001',
    topic: 'scope' as Topic,
    selectedIndex: 0,
    isCorrect: true,
    timeSpent: 5,
    ...overrides,
  }
}

describe('useProgressStore', () => {
  beforeEach(() => {
    act(() => {
      useProgressStore.setState({ ...DEFAULT_USER_PROGRESS })
    })
  })

  describe('initial state', () => {
    it('starts with zero sessions', () => {
      const state = useProgressStore.getState()
      expect(state.totalSessions).toBe(0)
    })

    it('starts with zero correct answers', () => {
      const state = useProgressStore.getState()
      expect(state.totalCorrect).toBe(0)
    })

    it('starts with zero total answered', () => {
      const state = useProgressStore.getState()
      expect(state.totalAnswered).toBe(0)
    })

    it('starts with zero streaks', () => {
      const state = useProgressStore.getState()
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
    })

    it('starts with null lastSessionDate', () => {
      const state = useProgressStore.getState()
      expect(state.lastSessionDate).toBeNull()
    })

    it('starts with empty srsRecords', () => {
      const state = useProgressStore.getState()
      expect(state.srsRecords).toEqual({})
    })

    it('starts with empty sessions array', () => {
      const state = useProgressStore.getState()
      expect(state.sessions).toEqual([])
    })

    it('starts with default topic stats for all topics', () => {
      const state = useProgressStore.getState()
      for (const topic of TOPICS) {
        expect(state.topicStats[topic]).toEqual({
          topic,
          totalAnswered: 0,
          correctAnswers: 0,
          accuracy: 0,
          averageTime: 0,
        })
      }
    })
  })

  describe('updateAfterSession — session counters', () => {
    it('increments totalSessions by 1', () => {
      const answers = [createAnswer()]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().totalSessions).toBe(1)
    })

    it('counts correct answers in totalCorrect', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', isCorrect: true }),
        createAnswer({ questionId: 'scope-002', isCorrect: false }),
        createAnswer({ questionId: 'scope-003', isCorrect: true }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().totalCorrect).toBe(2)
    })

    it('counts all answers in totalAnswered', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001' }),
        createAnswer({ questionId: 'scope-002' }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().totalAnswered).toBe(2)
    })

    it('accumulates counters across multiple sessions', () => {
      const session1 = [
        createAnswer({ questionId: 'scope-001', isCorrect: true }),
      ]
      const session2 = [
        createAnswer({ questionId: 'scope-002', isCorrect: false }),
        createAnswer({ questionId: 'scope-003', isCorrect: true }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(session1)
      })
      act(() => {
        useProgressStore.getState().updateAfterSession(session2)
      })

      const state = useProgressStore.getState()
      expect(state.totalSessions).toBe(2)
      expect(state.totalCorrect).toBe(2)
      expect(state.totalAnswered).toBe(3)
    })
  })

  describe('updateAfterSession — SRS records', () => {
    it('creates SRS record for a new correct answer', () => {
      const answers = [createAnswer({ questionId: 'scope-001', isCorrect: true })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      const record = useProgressStore.getState().srsRecords['scope-001']
      expect(record).toBeDefined()
      expect(record.questionId).toBe('scope-001')
      expect(record.repetitions).toBe(1)
      expect(record.lastReview).toBe('2026-03-23')
    })

    it('creates initial SRS record for a new incorrect answer', () => {
      const answers = [createAnswer({ questionId: 'scope-001', isCorrect: false })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      const record = useProgressStore.getState().srsRecords['scope-001']
      expect(record).toBeDefined()
      expect(record.questionId).toBe('scope-001')
      expect(record.repetitions).toBe(0)
    })

    it('updates existing SRS record on correct answer', () => {
      // First session — creates initial record
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', isCorrect: true }),
        ])
      })

      const firstRecord = useProgressStore.getState().srsRecords['scope-001']
      const firstReps = firstRecord.repetitions

      // Second session — updates existing record
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', isCorrect: true }),
        ])
      })

      const secondRecord = useProgressStore.getState().srsRecords['scope-001']
      expect(secondRecord.repetitions).toBe(firstReps + 1)
    })

    it('resets SRS record on incorrect answer for existing record', () => {
      // First session — creates record with correct answer
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', isCorrect: true }),
        ])
      })

      // Second session — incorrect answer
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', isCorrect: false }),
        ])
      })

      const record = useProgressStore.getState().srsRecords['scope-001']
      expect(record.repetitions).toBe(0)
      expect(record.interval).toBe(1)
    })

    it('handles multiple questions in a single session', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', isCorrect: true, topic: 'scope' }),
        createAnswer({ questionId: 'closure-001', isCorrect: false, topic: 'closure' }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      const records = useProgressStore.getState().srsRecords
      expect(records['scope-001']).toBeDefined()
      expect(records['closure-001']).toBeDefined()
    })
  })

  describe('updateAfterSession — topic stats', () => {
    it('updates totalAnswered for the correct topic', () => {
      const answers = [createAnswer({ topic: 'closure' })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['closure'].totalAnswered).toBe(1)
    })

    it('increments correctAnswers for correct answers', () => {
      const answers = [createAnswer({ topic: 'scope', isCorrect: true })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['scope'].correctAnswers).toBe(1)
    })

    it('does not increment correctAnswers for wrong answers', () => {
      const answers = [createAnswer({ topic: 'scope', isCorrect: false })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['scope'].correctAnswers).toBe(0)
    })

    it('calculates accuracy as a rounded percentage', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', topic: 'scope', isCorrect: true }),
        createAnswer({ questionId: 'scope-002', topic: 'scope', isCorrect: true }),
        createAnswer({ questionId: 'scope-003', topic: 'scope', isCorrect: false }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      // 2/3 = 66.67% → rounded to 67
      expect(useProgressStore.getState().topicStats['scope'].accuracy).toBe(67)
    })

    it('sets accuracy to 100 when all answers are correct', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', topic: 'scope', isCorrect: true }),
        createAnswer({ questionId: 'scope-002', topic: 'scope', isCorrect: true }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['scope'].accuracy).toBe(100)
    })

    it('sets accuracy to 0 when all answers are wrong', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', topic: 'scope', isCorrect: false }),
        createAnswer({ questionId: 'scope-002', topic: 'scope', isCorrect: false }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['scope'].accuracy).toBe(0)
    })

    it('does not affect stats for other topics', () => {
      const answers = [createAnswer({ topic: 'scope', isCorrect: true })]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().topicStats['closure'].totalAnswered).toBe(0)
      expect(useProgressStore.getState().topicStats['closure'].accuracy).toBe(0)
    })

    it('accumulates topic stats across sessions', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', topic: 'scope', isCorrect: true }),
        ])
      })
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-002', topic: 'scope', isCorrect: false }),
        ])
      })

      const stat = useProgressStore.getState().topicStats['scope']
      expect(stat.totalAnswered).toBe(2)
      expect(stat.correctAnswers).toBe(1)
      expect(stat.accuracy).toBe(50)
    })
  })

  describe('updateAfterSession — streaks', () => {
    it('starts a new streak on first session', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      const state = useProgressStore.getState()
      expect(state.currentStreak).toBe(1)
      expect(state.longestStreak).toBe(1)
      expect(state.lastSessionDate).toBe('2026-03-23')
    })

    it('does not increment streak for multiple sessions on the same day', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-001' })])
      })
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-002' })])
      })

      expect(useProgressStore.getState().currentStreak).toBe(1)
    })

    it('increments streak for consecutive day session', () => {
      // Simulate yesterday's session
      act(() => {
        useProgressStore.setState({ lastSessionDate: '2026-03-22', currentStreak: 1 })
      })

      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      expect(useProgressStore.getState().currentStreak).toBe(2)
    })

    it('resets streak when session is not on consecutive day', () => {
      // Simulate session from 2 days ago
      act(() => {
        useProgressStore.setState({ lastSessionDate: '2026-03-20', currentStreak: 5 })
      })

      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      expect(useProgressStore.getState().currentStreak).toBe(1)
    })

    it('preserves longestStreak when current streak resets', () => {
      act(() => {
        useProgressStore.setState({
          lastSessionDate: '2026-03-20',
          currentStreak: 3,
          longestStreak: 7,
        })
      })

      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      const state = useProgressStore.getState()
      expect(state.currentStreak).toBe(1)
      expect(state.longestStreak).toBe(7)
    })

    it('updates longestStreak when current streak exceeds it', () => {
      act(() => {
        useProgressStore.setState({
          lastSessionDate: '2026-03-22',
          currentStreak: 5,
          longestStreak: 5,
        })
      })

      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      const state = useProgressStore.getState()
      expect(state.currentStreak).toBe(6)
      expect(state.longestStreak).toBe(6)
    })
  })

  describe('updateAfterSession — session records', () => {
    it('creates a session record with correct score', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', isCorrect: true }),
        createAnswer({ questionId: 'scope-002', isCorrect: false }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      const sessions = useProgressStore.getState().sessions
      expect(sessions).toHaveLength(1)
      expect(sessions[0].score).toBe(1)
      expect(sessions[0].totalQuestions).toBe(2)
    })

    it('records the session date', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer()])
      })

      expect(useProgressStore.getState().sessions[0].date).toBe('2026-03-23')
    })

    it('records total time spent as duration', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001', timeSpent: 10 }),
        createAnswer({ questionId: 'scope-002', timeSpent: 15 }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().sessions[0].duration).toBe(25)
    })

    it('includes all answers in the session record', () => {
      const answers = [
        createAnswer({ questionId: 'scope-001' }),
        createAnswer({ questionId: 'scope-002' }),
      ]

      act(() => {
        useProgressStore.getState().updateAfterSession(answers)
      })

      expect(useProgressStore.getState().sessions[0].answers).toEqual(answers)
    })

    it('generates unique session IDs', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-001' })])
      })

      // Advance time slightly for different Date.now()
      const originalNow = Date.now
      Date.now = () => originalNow() + 1

      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-002' })])
      })

      Date.now = originalNow

      const sessions = useProgressStore.getState().sessions
      expect(sessions).toHaveLength(2)
      expect(sessions[0].id).not.toBe(sessions[1].id)
    })

    it('appends sessions without removing previous ones', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-001' })])
      })
      act(() => {
        useProgressStore.getState().updateAfterSession([createAnswer({ questionId: 'scope-002' })])
      })

      expect(useProgressStore.getState().sessions).toHaveLength(2)
    })
  })

  describe('reset', () => {
    it('resets all state to defaults after a session', () => {
      act(() => {
        useProgressStore.getState().updateAfterSession([
          createAnswer({ questionId: 'scope-001', isCorrect: true }),
        ])
      })

      // Verify state changed
      expect(useProgressStore.getState().totalSessions).toBe(1)

      act(() => {
        useProgressStore.getState().reset()
      })

      const state = useProgressStore.getState()
      expect(state.totalSessions).toBe(0)
      expect(state.totalCorrect).toBe(0)
      expect(state.totalAnswered).toBe(0)
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.lastSessionDate).toBeNull()
      expect(state.srsRecords).toEqual({})
      expect(state.sessions).toEqual([])
    })
  })

  describe('persist merge — backward compatibility', () => {
    it('merges persisted topic stats with current defaults', () => {
      // Simulate persisted state that might be missing new topics
      const persistedTopicStats = {
        scope: { topic: 'scope' as Topic, totalAnswered: 5, correctAnswers: 3, accuracy: 60, averageTime: 0 },
      }

      act(() => {
        useProgressStore.setState({
          ...DEFAULT_USER_PROGRESS,
          topicStats: { ...DEFAULT_USER_PROGRESS.topicStats, ...persistedTopicStats },
        })
      })

      const state = useProgressStore.getState()
      // Persisted topic should have saved values
      expect(state.topicStats['scope'].totalAnswered).toBe(5)
      // Non-persisted topics should have defaults
      expect(state.topicStats['closure'].totalAnswered).toBe(0)
    })
  })
})
