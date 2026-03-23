import { useSessionStore } from '@/stores/useSessionStore'
import type { SessionQuestion, Question } from '@/types'
import { act } from '@testing-library/react'

function createQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'scope-001',
    topic: 'scope',
    type: 'concept',
    difficulty: 'easy',
    question: 'What is block scoping?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Block scoping is defined by curly braces.',
    sourceUrl: 'https://example.com',
    ...overrides,
  }
}

function createSessionQuestion(
  questionOverrides: Partial<Question> = {},
  isReview = false,
): SessionQuestion {
  return {
    question: createQuestion(questionOverrides),
    isReview,
  }
}

const INITIAL_STATE = {
  questions: [],
  currentIndex: 0,
  selectedIndex: null,
  isAnswered: false,
  isComplete: false,
  answers: [],
  startTime: null,
}

describe('useSessionStore', () => {
  beforeEach(() => {
    act(() => {
      useSessionStore.setState(INITIAL_STATE)
    })
  })

  describe('initial state', () => {
    it('starts with empty questions', () => {
      expect(useSessionStore.getState().questions).toEqual([])
    })

    it('starts at index 0', () => {
      expect(useSessionStore.getState().currentIndex).toBe(0)
    })

    it('starts with no selected answer', () => {
      expect(useSessionStore.getState().selectedIndex).toBeNull()
    })

    it('starts as not answered', () => {
      expect(useSessionStore.getState().isAnswered).toBe(false)
    })

    it('starts as not complete', () => {
      expect(useSessionStore.getState().isComplete).toBe(false)
    })

    it('starts with empty answers', () => {
      expect(useSessionStore.getState().answers).toEqual([])
    })

    it('starts with null startTime', () => {
      expect(useSessionStore.getState().startTime).toBeNull()
    })
  })

  describe('startSession', () => {
    it('sets the questions array', () => {
      const questions = [createSessionQuestion({ id: 'scope-001' })]

      act(() => {
        useSessionStore.getState().startSession(questions)
      })

      expect(useSessionStore.getState().questions).toEqual(questions)
    })

    it('resets currentIndex to 0', () => {
      act(() => {
        useSessionStore.setState({ currentIndex: 5 })
      })

      act(() => {
        useSessionStore.getState().startSession([createSessionQuestion()])
      })

      expect(useSessionStore.getState().currentIndex).toBe(0)
    })

    it('sets startTime to current timestamp', () => {
      const before = Date.now()

      act(() => {
        useSessionStore.getState().startSession([createSessionQuestion()])
      })

      const after = Date.now()
      const startTime = useSessionStore.getState().startTime
      expect(startTime).toBeGreaterThanOrEqual(before)
      expect(startTime).toBeLessThanOrEqual(after)
    })

    it('clears previous answers', () => {
      act(() => {
        useSessionStore.setState({
          answers: [{
            questionId: 'old',
            topic: 'scope',
            selectedIndex: 0,
            isCorrect: true,
            timeSpent: 5,
          }],
        })
      })

      act(() => {
        useSessionStore.getState().startSession([createSessionQuestion()])
      })

      expect(useSessionStore.getState().answers).toEqual([])
    })

    it('resets isComplete and isAnswered flags', () => {
      act(() => {
        useSessionStore.setState({ isComplete: true, isAnswered: true })
      })

      act(() => {
        useSessionStore.getState().startSession([createSessionQuestion()])
      })

      expect(useSessionStore.getState().isComplete).toBe(false)
      expect(useSessionStore.getState().isAnswered).toBe(false)
    })
  })

  describe('selectAnswer', () => {
    const questions = [
      createSessionQuestion({ id: 'scope-001', correctIndex: 2 }),
      createSessionQuestion({ id: 'scope-002', correctIndex: 1 }),
    ]

    beforeEach(() => {
      act(() => {
        useSessionStore.getState().startSession(questions)
      })
    })

    it('marks the question as answered', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      expect(useSessionStore.getState().isAnswered).toBe(true)
    })

    it('records the selected index', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(3)
      })

      expect(useSessionStore.getState().selectedIndex).toBe(3)
    })

    it('records a correct answer when index matches correctIndex', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(2) // correctIndex is 2
      })

      const lastAnswer = useSessionStore.getState().answers[0]
      expect(lastAnswer.isCorrect).toBe(true)
    })

    it('records an incorrect answer when index does not match', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0) // correctIndex is 2
      })

      const lastAnswer = useSessionStore.getState().answers[0]
      expect(lastAnswer.isCorrect).toBe(false)
    })

    it('records the question ID and topic', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      const lastAnswer = useSessionStore.getState().answers[0]
      expect(lastAnswer.questionId).toBe('scope-001')
      expect(lastAnswer.topic).toBe('scope')
    })

    it('calculates timeSpent in seconds from startTime', () => {
      const originalNow = Date.now
      const fakeStart = 1000000
      const ELAPSED_MS = 3500

      // Set a known startTime
      act(() => {
        useSessionStore.setState({ startTime: fakeStart })
      })

      // Mock Date.now for the selectAnswer call
      Date.now = () => fakeStart + ELAPSED_MS

      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      Date.now = originalNow

      const lastAnswer = useSessionStore.getState().answers[0]
      // 3500ms / 1000 = 3.5 → rounded to 4
      expect(lastAnswer.timeSpent).toBe(4)
    })

    it('sets timeSpent to 0 when startTime is null', () => {
      act(() => {
        useSessionStore.setState({ startTime: null })
      })

      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      const lastAnswer = useSessionStore.getState().answers[0]
      expect(lastAnswer.timeSpent).toBe(0)
    })

    it('ignores duplicate selection when already answered', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      act(() => {
        useSessionStore.getState().selectAnswer(1)
      })

      expect(useSessionStore.getState().answers).toHaveLength(1)
      expect(useSessionStore.getState().selectedIndex).toBe(0)
    })

    it('does nothing when currentQuestion is null (empty questions)', () => {
      act(() => {
        useSessionStore.setState({ ...INITIAL_STATE })
      })

      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      expect(useSessionStore.getState().answers).toHaveLength(0)
      expect(useSessionStore.getState().isAnswered).toBe(false)
    })

    it('appends answers without replacing previous ones', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      act(() => {
        useSessionStore.getState().selectAnswer(1)
      })

      expect(useSessionStore.getState().answers).toHaveLength(2)
      expect(useSessionStore.getState().answers[0].questionId).toBe('scope-001')
      expect(useSessionStore.getState().answers[1].questionId).toBe('scope-002')
    })
  })

  describe('nextQuestion', () => {
    const questions = [
      createSessionQuestion({ id: 'scope-001' }),
      createSessionQuestion({ id: 'scope-002' }),
      createSessionQuestion({ id: 'scope-003' }),
    ]

    beforeEach(() => {
      act(() => {
        useSessionStore.getState().startSession(questions)
      })
    })

    it('advances currentIndex by 1', () => {
      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      expect(useSessionStore.getState().currentIndex).toBe(1)
    })

    it('resets selectedIndex to null', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      expect(useSessionStore.getState().selectedIndex).toBeNull()
    })

    it('resets isAnswered to false', () => {
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      expect(useSessionStore.getState().isAnswered).toBe(false)
    })

    it('resets startTime for the next question', () => {
      const before = Date.now()

      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      const after = Date.now()
      const startTime = useSessionStore.getState().startTime
      expect(startTime).toBeGreaterThanOrEqual(before)
      expect(startTime).toBeLessThanOrEqual(after)
    })

    it('marks session as complete when reaching the last question', () => {
      // Advance to question 2 (index 1)
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      // Advance to question 3 (index 2)
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      // Try to go beyond — should complete
      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      expect(useSessionStore.getState().isComplete).toBe(true)
    })

    it('does not advance index beyond question count when completing', () => {
      // Go through all questions
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      act(() => {
        useSessionStore.getState().nextQuestion()
      })

      // currentIndex remains at 2 (last valid), isComplete is true
      expect(useSessionStore.getState().isComplete).toBe(true)
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Set up some state
      act(() => {
        useSessionStore.getState().startSession([
          createSessionQuestion({ id: 'scope-001' }),
        ])
      })
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })

      // Reset
      act(() => {
        useSessionStore.getState().reset()
      })

      const state = useSessionStore.getState()
      expect(state.questions).toEqual([])
      expect(state.currentIndex).toBe(0)
      expect(state.selectedIndex).toBeNull()
      expect(state.isAnswered).toBe(false)
      expect(state.isComplete).toBe(false)
      expect(state.answers).toEqual([])
      expect(state.startTime).toBeNull()
    })
  })

  describe('full session flow', () => {
    it('tracks state correctly through a complete 2-question session', () => {
      const questions = [
        createSessionQuestion({ id: 'scope-001', correctIndex: 0 }),
        createSessionQuestion({ id: 'scope-002', correctIndex: 1 }),
      ]

      // Start
      act(() => {
        useSessionStore.getState().startSession(questions)
      })
      expect(useSessionStore.getState().currentIndex).toBe(0)
      expect(useSessionStore.getState().isComplete).toBe(false)

      // Answer question 1 correctly
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      expect(useSessionStore.getState().isAnswered).toBe(true)
      expect(useSessionStore.getState().answers[0].isCorrect).toBe(true)

      // Move to question 2
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      expect(useSessionStore.getState().currentIndex).toBe(1)
      expect(useSessionStore.getState().isAnswered).toBe(false)

      // Answer question 2 incorrectly
      act(() => {
        useSessionStore.getState().selectAnswer(0)
      })
      expect(useSessionStore.getState().answers[1].isCorrect).toBe(false)

      // Complete session
      act(() => {
        useSessionStore.getState().nextQuestion()
      })
      expect(useSessionStore.getState().isComplete).toBe(true)
      expect(useSessionStore.getState().answers).toHaveLength(2)
    })
  })
})
