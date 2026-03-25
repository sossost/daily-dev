import {
  generateEndlessPool,
  computeEndlessResult,
} from '@/lib/endless-session'
import { TOPICS, type Topic } from '@/types'

describe('generateEndlessPool', () => {
  it('generates a pool of all available questions', () => {
    const pool = generateEndlessPool({ topics: [...TOPICS], difficulty: 'all' })
    expect(pool.length).toBeGreaterThan(0)
  })

  it('marks all questions as non-review', () => {
    const pool = generateEndlessPool({ topics: [...TOPICS], difficulty: 'all' })
    expect(pool.every((sq) => sq.isReview === false)).toBe(true)
  })

  it('filters by topic', () => {
    const topics: Topic[] = ['scope']
    const pool = generateEndlessPool({ topics, difficulty: 'all' })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((sq) => sq.question.topic === 'scope')).toBe(true)
  })

  it('filters by difficulty', () => {
    const pool = generateEndlessPool({ topics: [...TOPICS], difficulty: 'easy' })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((sq) => sq.question.difficulty === 'easy')).toBe(true)
  })

  it('returns empty array for empty topic list', () => {
    const pool = generateEndlessPool({ topics: [], difficulty: 'all' })
    expect(pool).toHaveLength(0)
  })

  it('returns questions with unique IDs', () => {
    const pool = generateEndlessPool({ topics: [...TOPICS], difficulty: 'all' })
    const ids = pool.map((sq) => sq.question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('shuffles options for each question', () => {
    const pool = generateEndlessPool({ topics: [...TOPICS], difficulty: 'all' })
    for (const sq of pool) {
      expect(sq.question.options).toHaveLength(4)
    }
  })
})

describe('computeEndlessResult', () => {
  it('computes correct stats for mixed answers', () => {
    const answers = [
      { questionId: 'scope-001', topic: 'scope' as Topic, isCorrect: true },
      { questionId: 'scope-002', topic: 'scope' as Topic, isCorrect: false },
      { questionId: 'closure-001', topic: 'closure' as Topic, isCorrect: true },
      { questionId: 'closure-002', topic: 'closure' as Topic, isCorrect: true },
    ]
    const result = computeEndlessResult(answers)

    expect(result.totalAnswered).toBe(4)
    expect(result.correctCount).toBe(3)
    expect(result.accuracy).toBe(75)
  })

  it('returns zeros for empty answers', () => {
    const result = computeEndlessResult([])

    expect(result.totalAnswered).toBe(0)
    expect(result.correctCount).toBe(0)
    expect(result.accuracy).toBe(0)
    expect(result.topicBreakdown).toHaveLength(0)
  })

  it('computes topic breakdown correctly', () => {
    const answers = [
      { questionId: 'scope-001', topic: 'scope' as Topic, isCorrect: true },
      { questionId: 'scope-002', topic: 'scope' as Topic, isCorrect: false },
      { questionId: 'closure-001', topic: 'closure' as Topic, isCorrect: true },
    ]
    const result = computeEndlessResult(answers)

    expect(result.topicBreakdown).toHaveLength(2)

    const scopeStat = result.topicBreakdown.find((s) => s.topic === 'scope')
    expect(scopeStat).toBeDefined()
    expect(scopeStat?.correct).toBe(1)
    expect(scopeStat?.total).toBe(2)

    const closureStat = result.topicBreakdown.find((s) => s.topic === 'closure')
    expect(closureStat).toBeDefined()
    expect(closureStat?.correct).toBe(1)
    expect(closureStat?.total).toBe(1)
  })

  it('sorts topic breakdown by total count descending', () => {
    const answers = [
      { questionId: 'scope-001', topic: 'scope' as Topic, isCorrect: true },
      { questionId: 'scope-002', topic: 'scope' as Topic, isCorrect: true },
      { questionId: 'scope-003', topic: 'scope' as Topic, isCorrect: false },
      { questionId: 'closure-001', topic: 'closure' as Topic, isCorrect: true },
    ]
    const result = computeEndlessResult(answers)

    expect(result.topicBreakdown[0].topic).toBe('scope')
    expect(result.topicBreakdown[1].topic).toBe('closure')
  })

  it('handles all correct answers', () => {
    const answers = [
      { questionId: 'scope-001', topic: 'scope' as Topic, isCorrect: true },
      { questionId: 'scope-002', topic: 'scope' as Topic, isCorrect: true },
    ]
    const result = computeEndlessResult(answers)

    expect(result.accuracy).toBe(100)
    expect(result.correctCount).toBe(2)
  })

  it('handles all incorrect answers', () => {
    const answers = [
      { questionId: 'scope-001', topic: 'scope' as Topic, isCorrect: false },
      { questionId: 'scope-002', topic: 'scope' as Topic, isCorrect: false },
    ]
    const result = computeEndlessResult(answers)

    expect(result.accuracy).toBe(0)
    expect(result.correctCount).toBe(0)
  })
})
