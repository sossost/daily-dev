import {
  getAllQuestions,
  getQuestionsByTopic,
  getQuestionById,
  getTopicQuestionCounts,
} from '@/lib/questions'
import { TOPICS } from '@/types'

describe('getAllQuestions', () => {
  it('returns all questions as a flat array', () => {
    const questions = getAllQuestions()

    expect(questions.length).toBeGreaterThanOrEqual(41)
  })

  it('returns questions with required fields', () => {
    const questions = getAllQuestions()

    for (const q of questions) {
      expect(q.id).toBeDefined()
      expect(q.topic).toBeDefined()
      expect(q.type).toBeDefined()
      expect(q.difficulty).toBeDefined()
      expect(q.question).toBeDefined()
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThanOrEqual(3)
      expect(q.explanation.length).toBeGreaterThanOrEqual(20)
      expect(q.sourceUrl).toMatch(/^http/)
    }
  })
})

describe('getQuestionsByTopic', () => {
  it('returns questions filtered by topic', () => {
    const scopeQuestions = getQuestionsByTopic('scope')

    expect(scopeQuestions.length).toBeGreaterThanOrEqual(5)
    for (const q of scopeQuestions) {
      expect(q.topic).toBe('scope')
    }
  })

  it('returns questions for each topic', () => {
    for (const topic of TOPICS) {
      const questions = getQuestionsByTopic(topic)
      expect(questions.length).toBeGreaterThan(0)
    }
  })
})

describe('getQuestionById', () => {
  it('returns a question by its id', () => {
    const question = getQuestionById('scope-001')

    expect(question).not.toBeNull()
    expect(question?.id).toBe('scope-001')
    expect(question?.topic).toBe('scope')
  })

  it('returns null for non-existent id', () => {
    const question = getQuestionById('non-existent-999')

    expect(question).toBeNull()
  })
})

describe('getTopicQuestionCounts', () => {
  it('returns counts for all topics', () => {
    const counts = getTopicQuestionCounts()

    expect(counts['scope']).toBeGreaterThanOrEqual(5)
    expect(counts['closure']).toBeGreaterThanOrEqual(7)
    expect(counts['prototype']).toBeGreaterThanOrEqual(5)
    expect(counts['this']).toBeGreaterThanOrEqual(6)
    expect(counts['event-loop']).toBeGreaterThanOrEqual(6)
    expect(counts['async']).toBeGreaterThanOrEqual(6)
    expect(counts['type-coercion']).toBeGreaterThanOrEqual(6)
  })

  it('total matches getAllQuestions length', () => {
    const counts = getTopicQuestionCounts()
    const total = Object.values(counts).reduce((sum, c) => sum + c, 0)

    expect(total).toBe(getAllQuestions().length)
  })
})
