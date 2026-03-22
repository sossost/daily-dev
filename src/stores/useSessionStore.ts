import { create } from 'zustand'
import type { SessionQuestion, SessionAnswer, Topic } from '@/types'

interface SessionState {
  questions: SessionQuestion[]
  currentIndex: number
  selectedIndex: number | null
  isAnswered: boolean
  isComplete: boolean
  answers: SessionAnswer[]
  startTime: number | null

  startSession: (questions: SessionQuestion[]) => void
  selectAnswer: (index: number) => void
  nextQuestion: () => void
  reset: () => void
}

const INITIAL_STATE = {
  questions: [] as SessionQuestion[],
  currentIndex: 0,
  selectedIndex: null as number | null,
  isAnswered: false,
  isComplete: false,
  answers: [] as SessionAnswer[],
  startTime: null as number | null,
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...INITIAL_STATE,

  startSession: (questions) => {
    set({
      ...INITIAL_STATE,
      questions,
      startTime: Date.now(),
    })
  },

  selectAnswer: (index) => {
    const { isAnswered, questions, currentIndex, answers, startTime } = get()
    if (isAnswered) {
      return
    }

    const currentQuestion = questions[currentIndex]
    if (currentQuestion == null) {
      return
    }

    const isCorrect = index === currentQuestion.question.correctIndex
    const topic: Topic = currentQuestion.question.topic
    const now = Date.now()
    const TIME_DIVISOR_MS = 1000
    const timeSpent = startTime != null
      ? Math.round((now - startTime) / TIME_DIVISOR_MS)
      : 0

    const answer: SessionAnswer = {
      questionId: currentQuestion.question.id,
      topic,
      selectedIndex: index,
      isCorrect,
      timeSpent,
    }

    set({
      selectedIndex: index,
      isAnswered: true,
      answers: [...answers, answer],
    })
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get()
    const nextIndex = currentIndex + 1

    if (nextIndex >= questions.length) {
      set({ isComplete: true })
      return
    }

    set({
      currentIndex: nextIndex,
      selectedIndex: null,
      isAnswered: false,
      startTime: Date.now(),
    })
  },

  reset: () => {
    set(INITIAL_STATE)
  },
}))
