import { generateSession, selectReviewQuestions, selectNewQuestions, shuffleOptions } from '@/lib/session'
import type { SRSRecord, Question } from '@/types'
import { SESSION_TOTAL_QUESTIONS, SESSION_REVIEW_QUESTIONS } from '@/types'
import * as dateModule from '@/lib/date'

// Mock date module to control "today"
jest.mock('@/lib/date', () => ({
  ...jest.requireActual('@/lib/date'),
  getToday: jest.fn(() => '2024-01-15'),
}))

describe('shuffleOptions', () => {
  it('preserves all options and remaps correctIndex', () => {
    const question: Question = {
      id: 'test-001',
      topic: 'scope',
      type: 'concept',
      difficulty: 'easy',
      question: 'Test?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 2,
      explanation: 'This is a test explanation.',
      sourceUrl: 'https://example.com',
    }

    const shuffled = shuffleOptions(question)

    // All options are preserved
    expect([...shuffled.options].sort()).toEqual(['A', 'B', 'C', 'D'])

    // correctIndex points to the correct answer
    expect(shuffled.options[shuffled.correctIndex]).toBe('C')
  })
})

describe('generateSession', () => {
  it('returns SESSION_TOTAL_QUESTIONS questions', () => {
    const session = generateSession({})

    expect(session.length).toBe(SESSION_TOTAL_QUESTIONS)
  })

  it('includes due review questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-14', // Due (before today)
        lastReview: '2024-01-13',
      },
      'scope-002': {
        questionId: 'scope-002',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-15', // Due (today)
        lastReview: '2024-01-14',
      },
    }

    const session = generateSession(srsRecords)
    const questionIds = session.map((sq) => sq.question.id)

    expect(questionIds).toContain('scope-001')
    expect(questionIds).toContain('scope-002')
  })

  it('limits review questions to SESSION_REVIEW_QUESTIONS', () => {
    const srsRecords: Record<string, SRSRecord> = {}
    // Create 8 due review records (more than the limit of 5)
    const questionIds = [
      'scope-001', 'scope-002', 'scope-003', 'scope-004', 'scope-005',
      'closure-001', 'closure-002', 'closure-003',
    ]
    for (const id of questionIds) {
      srsRecords[id] = {
        questionId: id,
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-14',
        lastReview: '2024-01-13',
      }
    }

    const session = generateSession(srsRecords)
    const reviewQuestions = session.filter((sq) => sq.isReview === true)

    expect(reviewQuestions.length).toBeLessThanOrEqual(SESSION_REVIEW_QUESTIONS)
  })

  it('fills remaining slots with new (unattempted) questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-14',
        lastReview: '2024-01-13',
      },
    }

    const session = generateSession(srsRecords)
    const newQuestions = session.filter((sq) => sq.isReview === false)

    // 1 review + rest should be new
    expect(newQuestions.length).toBe(SESSION_TOTAL_QUESTIONS - 1)
  })

  it('handles no review questions gracefully', () => {
    const session = generateSession({})
    const newQuestions = session.filter((sq) => sq.isReview === false)

    expect(session.length).toBe(SESSION_TOTAL_QUESTIONS)
    expect(newQuestions.length).toBe(SESSION_TOTAL_QUESTIONS)
  })

  it('handles few total questions gracefully', () => {
    // When all questions have been attempted and none are due
    const srsRecords: Record<string, SRSRecord> = {}
    // Mark many questions as attempted but not due
    const ids = [
      'scope-001', 'scope-002', 'scope-003', 'scope-004', 'scope-005',
      'closure-001', 'closure-002', 'closure-003', 'closure-004', 'closure-005',
    ]
    for (const id of ids) {
      srsRecords[id] = {
        questionId: id,
        ease: 2.5,
        interval: 30,
        repetitions: 5,
        nextReview: '2024-02-15', // Not due
        lastReview: '2024-01-15',
      }
    }

    const session = generateSession(srsRecords)

    // Should still return questions (new unattempted ones)
    expect(session.length).toBeGreaterThan(0)
    expect(session.length).toBeLessThanOrEqual(SESSION_TOTAL_QUESTIONS)
  })

  it('does not include attempted questions as new', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 30,
        repetitions: 5,
        nextReview: '2024-02-15', // Not due
        lastReview: '2024-01-15',
      },
    }

    const session = generateSession(srsRecords)
    const newQuestions = session.filter((sq) => sq.isReview === false)
    const newIds = newQuestions.map((sq) => sq.question.id)

    expect(newIds).not.toContain('scope-001')
  })

  it('prioritizes older review questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-10', // Oldest overdue
        lastReview: '2024-01-09',
      },
      'scope-002': {
        questionId: 'scope-002',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-14', // More recent
        lastReview: '2024-01-13',
      },
    }

    const reviews = selectReviewQuestions(srsRecords, '2024-01-15')
    expect(reviews[0].id).toBe('scope-001')
    expect(reviews[1].id).toBe('scope-002')
  })
})

describe('selectNewQuestions', () => {
  it('excludes attempted questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-02-15',
        lastReview: '2024-01-15',
      },
    }

    const newQuestions = selectNewQuestions(srsRecords)
    const ids = newQuestions.map((q) => q.id)

    expect(ids).not.toContain('scope-001')
  })

  it('returns all questions when none attempted', () => {
    const newQuestions = selectNewQuestions({})

    expect(newQuestions.length).toBeGreaterThan(0)
  })
})
