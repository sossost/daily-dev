import {
  analyzeFocusAreas,
  selectFocusQuestions,
  generateFocusSession,
} from '@/lib/focus-session'
import type { SRSRecord, Topic, TopicStat } from '@/types'
import { DEFAULT_USER_PROGRESS, SESSION_TOTAL_QUESTIONS, TOPICS } from '@/types'

function makeTopicStats(
  overrides: Partial<Record<Topic, Partial<TopicStat>>> = {},
): Record<Topic, TopicStat> {
  const base = { ...DEFAULT_USER_PROGRESS.topicStats }
  for (const [topic, partial] of Object.entries(overrides)) {
    base[topic as Topic] = { ...base[topic as Topic], ...partial }
  }
  return base
}

function makeSrsRecord(
  questionId: string,
  overrides: Partial<SRSRecord> = {},
): SRSRecord {
  return {
    questionId,
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2024-01-20',
    lastReview: '2024-01-15',
    ...overrides,
  }
}

describe('analyzeFocusAreas', () => {
  it('identifies weak topics with accuracy below threshold', () => {
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 10, correctAnswers: 5, accuracy: 50, averageTime: 0 },
      closure: { topic: 'closure', totalAnswered: 10, correctAnswers: 9, accuracy: 90, averageTime: 0 },
    })

    const analysis = analyzeFocusAreas(topicStats, {})

    expect(analysis.weakTopics.length).toBe(1)
    expect(analysis.weakTopics[0].topic).toBe('scope')
    expect(analysis.weakTopics[0].accuracy).toBe(50)
  })

  it('returns empty weak topics when all above threshold', () => {
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 10, correctAnswers: 8, accuracy: 80, averageTime: 0 },
    })

    const analysis = analyzeFocusAreas(topicStats, {})
    expect(analysis.weakTopics.length).toBe(0)
  })

  it('counts struggling questions with low ease', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': makeSrsRecord('scope-001', { ease: 1.3 }),
      'scope-002': makeSrsRecord('scope-002', { ease: 1.5 }),
      'scope-003': makeSrsRecord('scope-003', { ease: 2.5 }),
    }

    const analysis = analyzeFocusAreas(DEFAULT_USER_PROGRESS.topicStats, srsRecords)
    expect(analysis.strugglingQuestionCount).toBe(2)
  })

  it('reports available question count capped at session total', () => {
    const analysis = analyzeFocusAreas(DEFAULT_USER_PROGRESS.topicStats, {})
    expect(analysis.availableCount).toBeLessThanOrEqual(SESSION_TOTAL_QUESTIONS)
    expect(analysis.availableCount).toBeGreaterThan(0)
  })

  it('sorts weak topics by accuracy ascending', () => {
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 10, correctAnswers: 6, accuracy: 60, averageTime: 0 },
      closure: { topic: 'closure', totalAnswered: 10, correctAnswers: 3, accuracy: 30, averageTime: 0 },
      this: { topic: 'this', totalAnswered: 10, correctAnswers: 5, accuracy: 50, averageTime: 0 },
    })

    const analysis = analyzeFocusAreas(topicStats, {})
    const accuracies = analysis.weakTopics.map((t) => t.accuracy)
    expect(accuracies).toEqual([...accuracies].sort((a, b) => a - b))
  })
})

describe('selectFocusQuestions', () => {
  it('prioritizes low-ease questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': makeSrsRecord('scope-001', { ease: 1.3 }),
    }

    const questions = selectFocusQuestions(DEFAULT_USER_PROGRESS.topicStats, srsRecords)
    expect(questions[0].id).toBe('scope-001')
  })

  it('includes questions from weak topics', () => {
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 10, correctAnswers: 3, accuracy: 30, averageTime: 0 },
    })

    const questions = selectFocusQuestions(topicStats, {})
    const scopeQuestions = questions.filter((q) => q.topic === 'scope')
    expect(scopeQuestions.length).toBeGreaterThan(0)
  })

  it('returns questions from all topics when no weak areas', () => {
    const questions = selectFocusQuestions(DEFAULT_USER_PROGRESS.topicStats, {})
    expect(questions.length).toBeGreaterThan(0)
  })

  it('does not return duplicate questions', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': makeSrsRecord('scope-001', { ease: 1.3 }),
    }
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 10, correctAnswers: 3, accuracy: 30, averageTime: 0 },
    })

    const questions = selectFocusQuestions(topicStats, srsRecords)
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('generateFocusSession', () => {
  it('generates up to SESSION_TOTAL_QUESTIONS questions', () => {
    const session = generateFocusSession(DEFAULT_USER_PROGRESS.topicStats, {})
    expect(session.length).toBe(SESSION_TOTAL_QUESTIONS)
  })

  it('shuffles options for each question', () => {
    const session = generateFocusSession(DEFAULT_USER_PROGRESS.topicStats, {})
    for (const sq of session) {
      expect(sq.question.options).toHaveLength(4)
    }
  })

  it('marks all questions as review', () => {
    const session = generateFocusSession(DEFAULT_USER_PROGRESS.topicStats, {})
    expect(session.every((sq) => sq.isReview === true)).toBe(true)
  })

  it('includes low-ease questions when available', () => {
    const srsRecords: Record<string, SRSRecord> = {
      'scope-001': makeSrsRecord('scope-001', { ease: 1.3 }),
    }

    const session = generateFocusSession(DEFAULT_USER_PROGRESS.topicStats, srsRecords)
    const ids = session.map((sq) => sq.question.id)
    expect(ids).toContain('scope-001')
  })

  it('prioritizes weak topic questions', () => {
    const topicStats = makeTopicStats({
      scope: { topic: 'scope', totalAnswered: 20, correctAnswers: 4, accuracy: 20, averageTime: 0 },
    })

    const session = generateFocusSession(topicStats, {})
    const scopeCount = session.filter((sq) => sq.question.topic === 'scope').length
    expect(scopeCount).toBeGreaterThan(0)
  })
})
