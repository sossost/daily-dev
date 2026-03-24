/**
 * Tests for the RetryWrongButton feature.
 * Tests the data-mapping logic for filtering incorrect answers
 * and building retry session questions.
 */
import type { SessionQuestion, SessionAnswer, Question } from '@/types'
import { shuffleOptions } from '@/lib/session'

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'scope-001',
    topic: 'scope',
    type: 'concept',
    difficulty: 'easy',
    question: 'What is block scope?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
    explanation: 'Block scope is defined by curly braces.',
    sourceUrl: 'https://example.com/scope',
    ...overrides,
  }
}

function makeSessionQuestion(overrides: Partial<SessionQuestion> = {}): SessionQuestion {
  return {
    question: makeQuestion(),
    isReview: false,
    ...overrides,
  }
}

function makeAnswer(overrides: Partial<SessionAnswer> = {}): SessionAnswer {
  return {
    questionId: 'scope-001',
    topic: 'scope',
    selectedIndex: 1,
    isCorrect: false,
    timeSpent: 5,
    ...overrides,
  }
}

function buildRetryQuestions(
  questions: readonly SessionQuestion[],
  answers: readonly SessionAnswer[],
): SessionQuestion[] {
  const incorrectAnswers = answers.filter((a) => !a.isCorrect)
  return incorrectAnswers
    .map((answer) => {
      const sessionQuestion = questions.find(
        (q) => q.question.id === answer.questionId
      )
      if (sessionQuestion == null) return null
      return {
        question: shuffleOptions(sessionQuestion.question),
        isReview: true,
      }
    })
    .filter((q): q is SessionQuestion => q != null)
}

describe('RetryWrongButton data logic', () => {
  it('filters only incorrect answers for retry', () => {
    const questions: SessionQuestion[] = [
      makeSessionQuestion({ question: makeQuestion({ id: 'scope-001' }) }),
      makeSessionQuestion({ question: makeQuestion({ id: 'closure-001', topic: 'closure' }) }),
      makeSessionQuestion({ question: makeQuestion({ id: 'proto-001', topic: 'prototype' }) }),
    ]

    const answers: SessionAnswer[] = [
      makeAnswer({ questionId: 'scope-001', isCorrect: true }),
      makeAnswer({ questionId: 'closure-001', isCorrect: false, topic: 'closure' }),
      makeAnswer({ questionId: 'proto-001', isCorrect: false, topic: 'prototype' }),
    ]

    const retryQuestions = buildRetryQuestions(questions, answers)

    expect(retryQuestions).toHaveLength(2)
    expect(retryQuestions[0].question.id).toBe('closure-001')
    expect(retryQuestions[1].question.id).toBe('proto-001')
  })

  it('marks all retry questions as review', () => {
    const questions: SessionQuestion[] = [
      makeSessionQuestion({
        question: makeQuestion({ id: 'scope-001' }),
        isReview: false,
      }),
    ]

    const answers: SessionAnswer[] = [
      makeAnswer({ questionId: 'scope-001', isCorrect: false }),
    ]

    const retryQuestions = buildRetryQuestions(questions, answers)

    expect(retryQuestions).toHaveLength(1)
    expect(retryQuestions[0].isReview).toBe(true)
  })

  it('returns empty array when all answers are correct', () => {
    const questions: SessionQuestion[] = [
      makeSessionQuestion({ question: makeQuestion({ id: 'scope-001' }) }),
    ]

    const answers: SessionAnswer[] = [
      makeAnswer({ questionId: 'scope-001', isCorrect: true }),
    ]

    const retryQuestions = buildRetryQuestions(questions, answers)

    expect(retryQuestions).toHaveLength(0)
  })

  it('returns empty array when answers array is empty', () => {
    const retryQuestions = buildRetryQuestions([], [])

    expect(retryQuestions).toHaveLength(0)
  })

  it('skips answers with no matching question', () => {
    const questions: SessionQuestion[] = [
      makeSessionQuestion({ question: makeQuestion({ id: 'scope-001' }) }),
    ]

    const answers: SessionAnswer[] = [
      makeAnswer({ questionId: 'scope-001', isCorrect: false }),
      makeAnswer({ questionId: 'nonexistent-999', isCorrect: false }),
    ]

    const retryQuestions = buildRetryQuestions(questions, answers)

    expect(retryQuestions).toHaveLength(1)
    expect(retryQuestions[0].question.id).toBe('scope-001')
  })

  it('reshuffles options so correctIndex may differ', () => {
    const question = makeQuestion({
      id: 'scope-001',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
    })

    const shuffled = shuffleOptions(question)

    expect(shuffled.id).toBe('scope-001')
    expect(shuffled.options).toHaveLength(4)
    expect(new Set(shuffled.options)).toEqual(new Set(['A', 'B', 'C', 'D']))
    expect(shuffled.options[shuffled.correctIndex]).toBe('A')
  })

  it('preserves question content after shuffle', () => {
    const original = makeQuestion({
      id: 'closure-001',
      topic: 'closure',
      explanation: 'Closures capture variables from enclosing scope.',
    })

    const shuffled = shuffleOptions(original)

    expect(shuffled.id).toBe(original.id)
    expect(shuffled.topic).toBe(original.topic)
    expect(shuffled.explanation).toBe(original.explanation)
    expect(shuffled.question).toBe(original.question)
  })
})
