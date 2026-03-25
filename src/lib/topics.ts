/**
 * Topic utility functions — derives position-based topic sets
 * from CATEGORIES definitions (single source of truth).
 */
import { CATEGORIES, TOPICS, type CategoryDefinition, type Position, type Topic } from '@/types'

/**
 * Get all topics that belong to a given position,
 * derived from CATEGORIES positions field.
 */
export function getTopicsForPosition(position: Position): readonly Topic[] {
  const topicSet = new Set<Topic>()

  for (const category of CATEGORIES) {
    if (category.positions.includes(position)) {
      for (const topic of category.topics) {
        topicSet.add(topic)
      }
    }
  }

  // Return in the same order as TOPICS for consistency
  return TOPICS.filter((t) => topicSet.has(t))
}

/**
 * Get categories that belong to a given position.
 */
export function getCategoriesForPosition(position: Position): readonly CategoryDefinition[] {
  return CATEGORIES.filter((c) => c.positions.includes(position))
}

/**
 * Get the number of topics for a position.
 */
export function getPositionTopicCount(position: Position): number {
  return getTopicsForPosition(position).length
}

/**
 * Convert enabledTopics to a topicFilter parameter.
 * Returns undefined when all topics are enabled (no filtering needed).
 */
export function createTopicFilter(enabledTopics: readonly Topic[]): readonly Topic[] | undefined {
  if (enabledTopics.length === TOPICS.length) return undefined
  return enabledTopics
}

/** All available positions. */
export const POSITIONS: readonly Position[] = ['frontend', 'backend', 'fullstack', 'devops'] as const
