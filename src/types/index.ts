// Topic definitions
export const TOPICS = [
  'scope',
  'closure',
  'prototype',
  'this',
  'event-loop',
  'async',
  'type-coercion',
  'typescript',
  'promise',
  'dom-manipulation',
] as const

export type Topic = (typeof TOPICS)[number]

// Korean labels for UI display
export const TOPIC_LABELS: Record<Topic, string> = {
  scope: '스코프',
  closure: '클로저',
  prototype: '프로토타입',
  this: 'this 키워드',
  'event-loop': '이벤트 루프',
  async: '비동기',
  'type-coercion': '타입 변환',
  typescript: '타입스크립트',
  promise: '프로미스',
  'dom-manipulation': 'DOM 조작',
}

// Question schema
export type QuestionType = 'concept' | 'output-prediction' | 'debugging' | 'comparison'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  topic: Topic
  type: QuestionType
  difficulty: Difficulty
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  sourceUrl: string
  code?: string
}

// Spaced Repetition System
export interface SRSRecord {
  questionId: string
  ease: number
  interval: number
  repetitions: number
  nextReview: string
  lastReview: string
}

export const DEFAULT_SRS_RECORD: Omit<SRSRecord, 'questionId' | 'nextReview' | 'lastReview'> = {
  ease: 2.5,
  interval: 1,
  repetitions: 0,
}

// Session types
export interface SessionQuestion {
  question: Question
  isReview: boolean
}

export interface SessionAnswer {
  questionId: string
  topic: Topic
  selectedIndex: number
  isCorrect: boolean
  timeSpent: number
}

export interface SessionRecord {
  id: string
  date: string
  answers: SessionAnswer[]
  score: number
  totalQuestions: number
  duration: number
}

// Statistics
export interface TopicStat {
  topic: Topic
  totalAnswered: number
  correctAnswers: number
  accuracy: number
  averageTime: number
}

export interface UserProgress {
  totalSessions: number
  totalCorrect: number
  totalAnswered: number
  currentStreak: number
  longestStreak: number
  lastSessionDate: string | null
  topicStats: Record<Topic, TopicStat>
  srsRecords: Record<string, SRSRecord>
  sessions: SessionRecord[]
}

export const DEFAULT_USER_PROGRESS: UserProgress = {
  totalSessions: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: null,
  topicStats: Object.fromEntries(
    TOPICS.map((topic) => [
      topic,
      {
        topic,
        totalAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 0,
      },
    ])
  ) as Record<Topic, TopicStat>,
  srsRecords: {},
  sessions: [],
}

// Session constants
export const SESSION_TOTAL_QUESTIONS = 10
export const SESSION_REVIEW_QUESTIONS = 5
export const SESSION_NEW_QUESTIONS = 5
