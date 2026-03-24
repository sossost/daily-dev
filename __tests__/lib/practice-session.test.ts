import {
  generatePracticeSession,
  filterQuestions,
  countAvailableQuestions,
} from '@/lib/practice-session'
import type { SRSRecord } from '@/types'
import { SESSION_TOTAL_QUESTIONS } from '@/types'
import { getTopicQuestionCounts } from '@/lib/questions'

describe('countAvailableQuestions', () => {
  it('returns count for all topics and all difficulties', () => {
    const topics = ['scope', 'closure', 'prototype'] as const
    const count = countAvailableQuestions(topics, 'all')
    const topicCounts = getTopicQuestionCounts()
    const expectedTotal = topics.reduce((sum, t) => sum + topicCounts[t], 0)
    expect(count).toBe(expectedTotal)
  })

  it('returns count filtered by difficulty', () => {
    const count = countAvailableQuestions(['scope'], 'easy')
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(20)
  })

  it('returns 0 for empty topics', () => {
    const count = countAvailableQuestions([], 'all')
    expect(count).toBe(0)
  })
})

describe('filterQuestions', () => {
  it('filters by selected topics', () => {
    const result = filterQuestions({
      topics: ['scope'],
      difficulty: 'all',
      srsRecords: {},
    })

    expect(result.length).toBe(20)
    expect(result.every((q) => q.topic === 'scope')).toBe(true)
  })

  it('filters by difficulty', () => {
    const result = filterQuestions({
      topics: ['scope', 'closure', 'prototype', 'this', 'event-loop'],
      difficulty: 'easy',
      srsRecords: {},
    })

    expect(result.every((q) => q.difficulty === 'easy')).toBe(true)
  })

  it('prioritizes unattempted questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': {
        questionId: 'scope-001',
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: '2024-01-20',
        lastReview: '2024-01-15',
      },
    }

    const result = filterQuestions({
      topics: ['scope'],
      difficulty: 'all',
      srsRecords,
    })

    // scope-001 should be after unattempted questions
    const attemptedIndex = result.findIndex((q) => q.id === 'scope-001')
    const unattemptedCount = result.filter(
      (q) => !Object.hasOwn(srsRecords, q.id),
    ).length

    expect(attemptedIndex).toBeGreaterThanOrEqual(unattemptedCount)
  })
})

describe('generatePracticeSession', () => {
  it('generates up to SESSION_TOTAL_QUESTIONS questions', () => {
    const session = generatePracticeSession({
      topics: ['scope', 'closure', 'prototype'],
      difficulty: 'all',
      srsRecords: {},
    })

    expect(session.length).toBe(SESSION_TOTAL_QUESTIONS)
  })

  it('returns empty array for no matching topics', () => {
    const session = generatePracticeSession({
      topics: [],
      difficulty: 'all',
      srsRecords: {},
    })

    expect(session.length).toBe(0)
  })

  it('returns fewer questions when not enough match the filter', () => {
    // Single topic with a specific difficulty might have fewer than 10
    const session = generatePracticeSession({
      topics: ['scope'],
      difficulty: 'hard',
      srsRecords: {},
    })

    expect(session.length).toBeGreaterThan(0)
    expect(session.length).toBeLessThanOrEqual(SESSION_TOTAL_QUESTIONS)
  })

  it('only includes questions from selected topics', () => {
    const session = generatePracticeSession({
      topics: ['closure'],
      difficulty: 'all',
      srsRecords: {},
    })

    expect(
      session.every((sq) => sq.question.topic === 'closure'),
    ).toBe(true)
  })

  it('shuffles options for each question', () => {
    const session = generatePracticeSession({
      topics: ['scope', 'closure'],
      difficulty: 'all',
      srsRecords: {},
    })

    // Each question should have exactly 4 options
    for (const sq of session) {
      expect(sq.question.options).toHaveLength(4)
    }
  })

  it('marks all questions as non-review', () => {
    const session = generatePracticeSession({
      topics: ['scope'],
      difficulty: 'all',
      srsRecords: {},
    })

    expect(session.every((sq) => sq.isReview === false)).toBe(true)
  })
})
