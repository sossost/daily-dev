/**
 * Wrong answer analysis — extracts and groups wrong answers from session history.
 * Used by the wrong answer notebook (오답 노트) to help users review mistakes.
 */
import type { Question, SessionAnswer, SessionRecord, SessionQuestion, Topic } from '@/types'
import { TOPIC_LABELS } from '@/types'
import { getQuestionById } from '@/lib/questions'
import { shuffleOptions } from '@/lib/session'

export interface WrongAnswerEntry {
  readonly question: Question
  readonly wrongCount: number
  readonly lastWrongDate: string
}

export interface WrongAnswerTopicGroup {
  readonly topic: Topic
  readonly label: string
  readonly entries: readonly WrongAnswerEntry[]
}

/**
 * Extract unique wrong answers from session history.
 * Counts how many times each question was answered incorrectly.
 * Only includes questions that exist in the current question bank.
 */
export function extractWrongAnswers(
  sessions: readonly SessionRecord[],
): readonly WrongAnswerEntry[] {
  const wrongMap = new Map<string, { count: number; lastDate: string }>()

  for (const session of sessions) {
    for (const answer of session.answers) {
      if (!answer.isCorrect) {
        const existing = wrongMap.get(answer.questionId)
        if (existing != null) {
          wrongMap.set(answer.questionId, {
            count: existing.count + 1,
            lastDate: session.date > existing.lastDate ? session.date : existing.lastDate,
          })
        } else {
          wrongMap.set(answer.questionId, { count: 1, lastDate: session.date })
        }
      }
    }
  }

  const entries: WrongAnswerEntry[] = []
  for (const [questionId, data] of wrongMap) {
    const question = getQuestionById(questionId)
    if (question != null) {
      entries.push({
        question,
        wrongCount: data.count,
        lastWrongDate: data.lastDate,
      })
    }
  }

  return entries.sort((a, b) => b.wrongCount - a.wrongCount)
}

/**
 * Group wrong answer entries by topic, sorted by total wrong count descending.
 */
export function groupWrongAnswersByTopic(
  entries: readonly WrongAnswerEntry[],
): readonly WrongAnswerTopicGroup[] {
  const groupMap = new Map<Topic, WrongAnswerEntry[]>()

  for (const entry of entries) {
    const topic = entry.question.topic
    const group = groupMap.get(topic) ?? []
    group.push(entry)
    groupMap.set(topic, group)
  }

  const groups: WrongAnswerTopicGroup[] = []
  for (const [topic, topicEntries] of groupMap) {
    groups.push({
      topic,
      label: TOPIC_LABELS[topic],
      entries: topicEntries,
    })
  }

  const totalWrongCount = (group: WrongAnswerTopicGroup): number =>
    group.entries.reduce((sum, e) => sum + e.wrongCount, 0)

  return groups.sort((a, b) => totalWrongCount(b) - totalWrongCount(a))
}

/**
 * Generate a retry session from wrong answer entries.
 * Returns SessionQuestion[] ready for the session store.
 */
export function generateWrongAnswerSession(
  entries: readonly WrongAnswerEntry[],
): readonly SessionQuestion[] {
  return entries.map((entry) => ({
    question: shuffleOptions(entry.question),
    isReview: true,
  }))
}
