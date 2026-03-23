/**
 * Question loader — statically imports all topic JSON files at build time.
 * Provides indexed access by ID and topic. No runtime I/O.
 */
import type { Question, Topic } from '@/types'

import scopeQuestions from '../../data/questions/scope.json'
import closureQuestions from '../../data/questions/closure.json'
import prototypeQuestions from '../../data/questions/prototype.json'
import thisQuestions from '../../data/questions/this.json'
import eventLoopQuestions from '../../data/questions/event-loop.json'
import asyncQuestions from '../../data/questions/async.json'
import typeCoercionQuestions from '../../data/questions/type-coercion.json'

const ALL_QUESTIONS: Question[] = [
  ...scopeQuestions,
  ...closureQuestions,
  ...prototypeQuestions,
  ...thisQuestions,
  ...eventLoopQuestions,
  ...asyncQuestions,
  ...typeCoercionQuestions,
] as Question[]

const QUESTIONS_BY_ID = new Map<string, Question>(
  ALL_QUESTIONS.map((q) => [q.id, q]),
)

export function getAllQuestions(): Question[] {
  return ALL_QUESTIONS
}

export function getQuestionsByTopic(topic: Topic): Question[] {
  return ALL_QUESTIONS.filter((q) => q.topic === topic)
}

export function getQuestionById(id: string): Question | null {
  return QUESTIONS_BY_ID.get(id) ?? null
}

export function getTopicQuestionCounts(): Record<Topic, number> {
  const counts = {} as Record<Topic, number>

  for (const question of ALL_QUESTIONS) {
    const current = counts[question.topic] ?? 0
    counts[question.topic] = current + 1
  }

  return counts
}
