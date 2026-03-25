import { syncAfterSession } from '@/lib/supabase/syncSession'
import type { SessionRecord, SessionAnswer, SRSRecord, Topic, TopicStat } from '@/types'

const mockRpc = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc: mockRpc }),
}))

jest.mock('@/lib/supabase/currentUser', () => ({
  getCurrentUserId: jest.fn(() => 'user-123'),
}))

import { getCurrentUserId } from '@/lib/supabase/currentUser'

function createSessionRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 'session-1',
    date: '2026-03-23',
    answers: [],
    score: 1,
    totalQuestions: 1,
    duration: 10,
    ...overrides,
  }
}

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

function createSRSRecord(questionId: string): SRSRecord {
  return {
    questionId,
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2026-03-24',
    lastReview: '2026-03-23',
  }
}

function createTopicStat(topic: Topic): TopicStat {
  return {
    topic,
    totalAnswered: 1,
    correctAnswers: 1,
    accuracy: 100,
    averageTime: 5,
  }
}

describe('syncAfterSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRpc.mockResolvedValue({ error: null })
  })

  it('returns early when userId is null', async () => {
    ;(getCurrentUserId as jest.Mock).mockReturnValueOnce(null)

    await syncAfterSession(
      createSessionRecord(),
      [createAnswer()],
      { 'scope-001': createSRSRecord('scope-001') },
      { scope: createTopicStat('scope') } as Record<Topic, TopicStat>,
      { correct: 1, answered: 1, current_streak: 1, date: '2026-03-23' },
    )

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('calls rpc with correct parameters', async () => {
    const answers = [createAnswer()]
    const srsRecords = { 'scope-001': createSRSRecord('scope-001') }
    const topicStats = { scope: createTopicStat('scope') } as Record<Topic, TopicStat>
    const streakData = { correct: 1, answered: 1, current_streak: 1, date: '2026-03-23' }
    const sessionRecord = createSessionRecord()

    await syncAfterSession(sessionRecord, answers, srsRecords, topicStats, streakData)

    expect(mockRpc).toHaveBeenCalledWith('sync_after_session', {
      p_user_id: 'user-123',
      p_session: expect.objectContaining({
        id: 'session-1',
        user_id: 'user-123',
        score: 1,
        total_questions: 1,
      }),
      p_answers: expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-123',
          session_id: 'session-1',
          question_id: 'scope-001',
          is_correct: true,
        }),
      ]),
      p_srs_updates: expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-123',
          question_id: 'scope-001',
          ease: 2.5,
        }),
      ]),
      p_topic_updates: expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-123',
          topic: 'scope',
          total_answered: 1,
        }),
      ]),
      p_streak_data: streakData,
    })
  })

  it('only includes SRS records for answered questions', async () => {
    const answers = [createAnswer({ questionId: 'scope-001' })]
    const srsRecords = {
      'scope-001': createSRSRecord('scope-001'),
      'scope-002': createSRSRecord('scope-002'),
    }
    const topicStats = { scope: createTopicStat('scope') } as Record<Topic, TopicStat>

    await syncAfterSession(
      createSessionRecord(),
      answers,
      srsRecords,
      topicStats,
      { correct: 1, answered: 1, current_streak: 1, date: '2026-03-23' },
    )

    const call = mockRpc.mock.calls[0]
    const srsUpdates = call[1].p_srs_updates as Array<{ question_id: string }>
    expect(srsUpdates).toHaveLength(1)
    expect(srsUpdates[0].question_id).toBe('scope-001')
  })

  it('throws when rpc returns an error', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'DB error' } })

    await expect(
      syncAfterSession(
        createSessionRecord(),
        [createAnswer()],
        { 'scope-001': createSRSRecord('scope-001') },
        { scope: createTopicStat('scope') } as Record<Topic, TopicStat>,
        { correct: 1, answered: 1, current_streak: 1, date: '2026-03-23' },
      ),
    ).rejects.toThrow('Session sync failed: DB error')
  })
})
