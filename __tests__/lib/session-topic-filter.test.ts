import { generateSession, selectReviewQuestions, selectNewQuestions } from '@/lib/session'
import type { SRSRecord } from '@/types'
import { SESSION_TOTAL_QUESTIONS } from '@/types'

jest.mock('@/lib/date', () => ({
  ...jest.requireActual('@/lib/date'),
  getToday: jest.fn(() => '2024-01-15'),
}))

describe('session topic filter', () => {
  describe('selectReviewQuestions with topicFilter', () => {
    it('only returns questions from filtered topics', () => {
      const srsRecords: Record<string, SRSRecord> = {
        'scope-001': {
          questionId: 'scope-001',
          ease: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: '2024-01-14',
          lastReview: '2024-01-13',
        },
        'closure-001': {
          questionId: 'closure-001',
          ease: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: '2024-01-14',
          lastReview: '2024-01-13',
        },
      }

      const reviews = selectReviewQuestions(srsRecords, '2024-01-15', ['scope'])
      const topics = reviews.map((q) => q.topic)

      expect(topics).toContain('scope')
      expect(topics).not.toContain('closure')
    })

    it('returns all due questions when no filter is provided', () => {
      const srsRecords: Record<string, SRSRecord> = {
        'scope-001': {
          questionId: 'scope-001',
          ease: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: '2024-01-14',
          lastReview: '2024-01-13',
        },
        'closure-001': {
          questionId: 'closure-001',
          ease: 2.5,
          interval: 1,
          repetitions: 1,
          nextReview: '2024-01-14',
          lastReview: '2024-01-13',
        },
      }

      const reviews = selectReviewQuestions(srsRecords, '2024-01-15')
      const ids = reviews.map((q) => q.id)

      expect(ids).toContain('scope-001')
      expect(ids).toContain('closure-001')
    })
  })

  describe('selectNewQuestions with topicFilter', () => {
    it('only returns unattempted questions from filtered topics', () => {
      const newQuestions = selectNewQuestions({}, ['scope', 'closure'])
      const topics = new Set(newQuestions.map((q) => q.topic))

      expect(topics.has('scope')).toBe(true)
      expect(topics.has('closure')).toBe(true)
      expect(topics.has('prototype')).toBe(false)
    })

    it('returns questions from all topics when no filter is provided', () => {
      const newQuestions = selectNewQuestions({})
      const topics = new Set(newQuestions.map((q) => q.topic))

      expect(topics.size).toBeGreaterThan(2)
    })
  })

  describe('generateSession with topicFilter', () => {
    it('generates session with only filtered topics', () => {
      const session = generateSession({}, ['scope'])
      const topics = session.map((sq) => sq.question.topic)

      for (const topic of topics) {
        expect(topic).toBe('scope')
      }
    })

    it('generates full session when no filter is provided', () => {
      const session = generateSession({})
      expect(session.length).toBe(SESSION_TOTAL_QUESTIONS)
    })

    it('returns fewer questions when filtered topic has limited questions', () => {
      const srsRecords: Record<string, SRSRecord> = {}
      // Mark all scope questions as attempted and not due
      for (let i = 1; i <= 30; i++) {
        const id = `scope-${String(i).padStart(3, '0')}`
        srsRecords[id] = {
          questionId: id,
          ease: 2.5,
          interval: 30,
          repetitions: 5,
          nextReview: '2024-02-15',
          lastReview: '2024-01-15',
        }
      }

      const session = generateSession(srsRecords, ['scope'])
      // All scope questions are attempted and not due, so session should be empty
      expect(session.length).toBe(0)
    })
  })
})
