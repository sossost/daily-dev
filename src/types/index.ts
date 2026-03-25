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
  'css-layout',
  'web-performance',
  'react-basics',
  'data-structures',
  'design-patterns',
  'network',
  'algorithms',
  'nodejs',
  'browser-api',
  'api-design',
  'web-security',
  'database',
  'git-advanced',
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
  'css-layout': 'CSS 레이아웃',
  'web-performance': '웹 성능 최적화',
  'react-basics': 'React 기초',
  'data-structures': '자료구조',
  'design-patterns': '디자인 패턴',
  network: '네트워크',
  algorithms: '알고리즘',
  nodejs: 'Node.js',
  'browser-api': '브라우저 API',
  'api-design': 'API 설계',
  'web-security': '웹 보안',
  database: '데이터베이스',
  'git-advanced': 'Git 심화',
}

// Category definitions
export type Position = 'frontend' | 'backend' | 'fullstack' | 'devops'

export interface CategoryDefinition {
  readonly id: string
  readonly label: string
  readonly icon: string
  readonly topics: readonly Topic[]
  readonly positions: readonly Position[]
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  {
    id: 'js-core',
    label: 'JS Core',
    icon: '💻',
    topics: ['scope', 'closure', 'prototype', 'this', 'type-coercion'],
    positions: ['frontend', 'fullstack'],
  },
  {
    id: 'async',
    label: 'Async',
    icon: '⚡',
    topics: ['event-loop', 'async', 'promise'],
    positions: ['frontend', 'backend', 'fullstack'],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: '⌨️',
    topics: ['typescript'],
    positions: ['frontend', 'backend', 'fullstack'],
  },
  {
    id: 'web-platform',
    label: 'Web Platform',
    icon: '🌐',
    topics: ['dom-manipulation', 'css-layout', 'web-performance', 'browser-api'],
    positions: ['frontend', 'fullstack'],
  },
  {
    id: 'react',
    label: 'React',
    icon: '⚛️',
    topics: ['react-basics'],
    positions: ['frontend', 'fullstack'],
  },
  {
    id: 'cs-fundamentals',
    label: 'CS Fundamentals',
    icon: '📚',
    topics: ['data-structures', 'algorithms', 'design-patterns'],
    positions: ['frontend', 'backend', 'fullstack', 'devops'],
  },
  {
    id: 'network',
    label: 'Network',
    icon: '🌍',
    topics: ['network'],
    positions: ['frontend', 'backend', 'fullstack', 'devops'],
  },
  {
    id: 'backend',
    label: 'Backend',
    icon: '🖥️',
    topics: ['nodejs', 'database'],
    positions: ['backend', 'fullstack'],
  },
  {
    id: 'api-design',
    label: 'API Design',
    icon: '🔗',
    topics: ['api-design'],
    positions: ['frontend', 'backend', 'fullstack'],
  },
  {
    id: 'web-security',
    label: 'Web Security',
    icon: '🔒',
    topics: ['web-security'],
    positions: ['frontend', 'backend', 'fullstack'],
  },
  {
    id: 'devops',
    label: 'DevOps',
    icon: '🔧',
    topics: ['git-advanced'],
    positions: ['frontend', 'backend', 'fullstack', 'devops'],
  },
] as const

/** CATEGORIES with uncategorized topics appended as "기타" if any exist. */
export const CATEGORIES_WITH_FALLBACK: readonly CategoryDefinition[] = (() => {
  const categorizedTopics = new Set(CATEGORIES.flatMap((c) => c.topics))
  const uncategorized = TOPICS.filter((t) => !categorizedTopics.has(t))

  if (uncategorized.length === 0) return CATEGORIES

  return [
    ...CATEGORIES,
    {
      id: 'uncategorized',
      label: '기타',
      icon: '📦',
      topics: uncategorized,
      positions: ['frontend', 'backend', 'fullstack', 'devops'] satisfies readonly Position[],
    },
  ]
})()

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
