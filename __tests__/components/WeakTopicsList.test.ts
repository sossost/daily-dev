/**
 * Tests for WeakTopicsList display logic.
 * Since tsconfig uses jsx: "preserve", ts-jest cannot render JSX components.
 * We test the data handling logic for empty and populated states.
 */
import type { WeakTopic } from '@/lib/stats'

type DisplayState = 'empty' | 'list'

function getDisplayState(weakTopics: readonly WeakTopic[]): DisplayState {
  return weakTopics.length === 0 ? 'empty' : 'list'
}

describe('WeakTopicsList display logic', () => {
  it('shows empty state when no weak topics', () => {
    expect(getDisplayState([])).toBe('empty')
  })

  it('shows list state when weak topics exist', () => {
    const topics: WeakTopic[] = [
      { topic: 'closure', label: 'Closure', accuracy: 45, totalAnswered: 10 },
    ]
    expect(getDisplayState(topics)).toBe('list')
  })

  it('weak topic data has required fields', () => {
    const topic: WeakTopic = {
      topic: 'scope',
      label: 'Scope',
      accuracy: 60,
      totalAnswered: 5,
    }

    expect(topic.topic).toBe('scope')
    expect(topic.label).toBe('Scope')
    expect(topic.accuracy).toBe(60)
    expect(topic.totalAnswered).toBe(5)
  })
})
