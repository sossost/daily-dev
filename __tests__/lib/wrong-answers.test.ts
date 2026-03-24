import {
  extractWrongAnswers,
  groupWrongAnswersByTopic,
  generateWrongAnswerSession,
} from '@/lib/wrong-answers'
import type { SessionRecord } from '@/types'
import { getAllQuestions } from '@/lib/questions'

function makeSession(
  id: string,
  date: string,
  answers: Array<{ questionId: string; topic: string; isCorrect: boolean }>,
): SessionRecord {
  return {
    id,
    date,
    score: answers.filter((a) => a.isCorrect).length,
    totalQuestions: answers.length,
    duration: 60,
    answers: answers.map((a) => ({
      questionId: a.questionId,
      topic: a.topic as SessionRecord['answers'][number]['topic'],
      selectedIndex: 0,
      isCorrect: a.isCorrect,
      timeSpent: 5,
    })),
  }
}

describe('extractWrongAnswers', () => {
  it('returns empty array when no sessions', () => {
    expect(extractWrongAnswers([])).toEqual([])
  })

  it('returns empty array when all answers are correct', () => {
    const allQuestions = getAllQuestions()
    const q = allQuestions[0]
    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: q.id, topic: q.topic, isCorrect: true },
      ]),
    ]
    expect(extractWrongAnswers(sessions)).toEqual([])
  })

  it('extracts wrong answers with correct count', () => {
    const allQuestions = getAllQuestions()
    const q1 = allQuestions[0]
    const q2 = allQuestions[1]

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: q1.id, topic: q1.topic, isCorrect: false },
        { questionId: q2.id, topic: q2.topic, isCorrect: false },
      ]),
      makeSession('s2', '2024-01-16', [
        { questionId: q1.id, topic: q1.topic, isCorrect: false },
        { questionId: q2.id, topic: q2.topic, isCorrect: true },
      ]),
    ]

    const result = extractWrongAnswers(sessions)
    expect(result).toHaveLength(2)

    const q1Entry = result.find((e) => e.question.id === q1.id)
    const q2Entry = result.find((e) => e.question.id === q2.id)
    expect(q1Entry?.wrongCount).toBe(2)
    expect(q2Entry?.wrongCount).toBe(1)
  })

  it('sorts by wrong count descending', () => {
    const allQuestions = getAllQuestions()
    const q1 = allQuestions[0]
    const q2 = allQuestions[1]

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: q1.id, topic: q1.topic, isCorrect: false },
        { questionId: q2.id, topic: q2.topic, isCorrect: false },
      ]),
      makeSession('s2', '2024-01-16', [
        { questionId: q2.id, topic: q2.topic, isCorrect: false },
      ]),
    ]

    const result = extractWrongAnswers(sessions)
    expect(result[0].question.id).toBe(q2.id)
    expect(result[0].wrongCount).toBe(2)
    expect(result[1].question.id).toBe(q1.id)
    expect(result[1].wrongCount).toBe(1)
  })

  it('tracks last wrong date correctly', () => {
    const allQuestions = getAllQuestions()
    const q = allQuestions[0]

    const sessions = [
      makeSession('s1', '2024-01-10', [
        { questionId: q.id, topic: q.topic, isCorrect: false },
      ]),
      makeSession('s2', '2024-01-20', [
        { questionId: q.id, topic: q.topic, isCorrect: false },
      ]),
    ]

    const result = extractWrongAnswers(sessions)
    expect(result[0].lastWrongDate).toBe('2024-01-20')
  })

  it('ignores questions not in current question bank', () => {
    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: 'nonexistent-999', topic: 'scope', isCorrect: false },
      ]),
    ]
    expect(extractWrongAnswers(sessions)).toEqual([])
  })
})

describe('groupWrongAnswersByTopic', () => {
  it('returns empty array for empty input', () => {
    expect(groupWrongAnswersByTopic([])).toEqual([])
  })

  it('groups entries by topic', () => {
    const allQuestions = getAllQuestions()
    const scopeQ = allQuestions.find((q) => q.topic === 'scope')!
    const closureQ = allQuestions.find((q) => q.topic === 'closure')!

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: scopeQ.id, topic: scopeQ.topic, isCorrect: false },
        { questionId: closureQ.id, topic: closureQ.topic, isCorrect: false },
      ]),
    ]

    const entries = extractWrongAnswers(sessions)
    const groups = groupWrongAnswersByTopic(entries)

    expect(groups).toHaveLength(2)
    const topics = groups.map((g) => g.topic)
    expect(topics).toContain('scope')
    expect(topics).toContain('closure')
  })

  it('sorts groups by total wrong count descending', () => {
    const allQuestions = getAllQuestions()
    const scopeQuestions = allQuestions.filter((q) => q.topic === 'scope')
    const closureQ = allQuestions.find((q) => q.topic === 'closure')!

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: scopeQuestions[0].id, topic: 'scope', isCorrect: false },
        { questionId: scopeQuestions[1].id, topic: 'scope', isCorrect: false },
        { questionId: closureQ.id, topic: 'closure', isCorrect: false },
      ]),
    ]

    const entries = extractWrongAnswers(sessions)
    const groups = groupWrongAnswersByTopic(entries)

    expect(groups[0].topic).toBe('scope')
    expect(groups[1].topic).toBe('closure')
  })
})

describe('generateWrongAnswerSession', () => {
  it('returns empty array for empty input', () => {
    expect(generateWrongAnswerSession([])).toEqual([])
  })

  it('creates session questions from wrong entries', () => {
    const allQuestions = getAllQuestions()
    const q = allQuestions[0]

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: q.id, topic: q.topic, isCorrect: false },
      ]),
    ]

    const entries = extractWrongAnswers(sessions)
    const session = generateWrongAnswerSession(entries)

    expect(session).toHaveLength(1)
    expect(session[0].question.id).toBe(q.id)
    expect(session[0].isReview).toBe(true)
  })

  it('shuffles options for each question', () => {
    const allQuestions = getAllQuestions()
    const q = allQuestions[0]

    const sessions = [
      makeSession('s1', '2024-01-15', [
        { questionId: q.id, topic: q.topic, isCorrect: false },
      ]),
    ]

    const entries = extractWrongAnswers(sessions)

    // Run multiple times to check shuffling occurs
    const correctIndices = new Set<number>()
    const SHUFFLE_ATTEMPTS = 20
    for (let i = 0; i < SHUFFLE_ATTEMPTS; i++) {
      const session = generateWrongAnswerSession(entries)
      correctIndices.add(session[0].question.correctIndex)
    }

    // The correct answer should always point to the same option text
    const session = generateWrongAnswerSession(entries)
    const correctOption = session[0].question.options[session[0].question.correctIndex]
    expect(correctOption).toBe(q.options[q.correctIndex])
  })
}
)
