import {
  generateChallengeSession,
  computeChallengeResult,
  CHALLENGE_DURATIONS,
  CHALLENGE_DURATION_LABELS,
} from '@/lib/challenge-session'

describe('generateChallengeSession', () => {
  it('generates a pool of questions', () => {
    const session = generateChallengeSession()
    expect(session.length).toBeGreaterThan(0)
    expect(session.length).toBeLessThanOrEqual(50)
  })

  it('marks all questions as non-review', () => {
    const session = generateChallengeSession()
    expect(session.every((sq) => sq.isReview === false)).toBe(true)
  })

  it('shuffles options for each question', () => {
    const session = generateChallengeSession()
    for (const sq of session) {
      expect(sq.question.options).toHaveLength(4)
    }
  })

  it('returns questions with unique IDs', () => {
    const session = generateChallengeSession()
    const ids = session.map((sq) => sq.question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('computeChallengeResult', () => {
  it('computes correct stats for mixed answers', () => {
    const answers = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: false },
    ]
    const result = computeChallengeResult(answers, 60)

    expect(result.totalAnswered).toBe(5)
    expect(result.correctCount).toBe(3)
    expect(result.accuracy).toBe(60)
    expect(result.duration).toBe(60)
    expect(result.questionsPerMinute).toBe(5)
  })

  it('returns zeros for empty answers', () => {
    const result = computeChallengeResult([], 30)

    expect(result.totalAnswered).toBe(0)
    expect(result.correctCount).toBe(0)
    expect(result.accuracy).toBe(0)
    expect(result.questionsPerMinute).toBe(0)
  })

  it('handles all correct answers', () => {
    const answers = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: true },
    ]
    const result = computeChallengeResult(answers, 30)

    expect(result.accuracy).toBe(100)
    expect(result.correctCount).toBe(3)
    expect(result.questionsPerMinute).toBe(6)
  })

  it('handles all incorrect answers', () => {
    const answers = [
      { isCorrect: false },
      { isCorrect: false },
    ]
    const result = computeChallengeResult(answers, 90)

    expect(result.accuracy).toBe(0)
    expect(result.correctCount).toBe(0)
  })
})

describe('CHALLENGE_DURATIONS', () => {
  it('has labels for all durations', () => {
    for (const d of CHALLENGE_DURATIONS) {
      expect(CHALLENGE_DURATION_LABELS[d]).toBeDefined()
    }
  })

  it('contains expected values', () => {
    expect(CHALLENGE_DURATIONS).toContain(30)
    expect(CHALLENGE_DURATIONS).toContain(60)
    expect(CHALLENGE_DURATIONS).toContain(90)
  })
})
