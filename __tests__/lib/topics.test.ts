import { TOPICS, CATEGORIES } from '@/types'
import {
  getTopicsForPosition,
  getCategoriesForPosition,
  getPositionTopicCount,
  createTopicFilter,
  POSITIONS,
} from '@/lib/topics'

describe('POSITIONS', () => {
  it('contains all four positions', () => {
    expect(POSITIONS).toEqual(['frontend', 'backend', 'fullstack', 'devops'])
  })

  it('has exactly four entries', () => {
    expect(POSITIONS).toHaveLength(4)
  })
})

describe('getTopicsForPosition', () => {
  it('returns topics for frontend position', () => {
    const topics = getTopicsForPosition('frontend')
    expect(topics.length).toBeGreaterThan(0)
    // Frontend should include JS core topics
    expect(topics).toContain('scope')
    expect(topics).toContain('closure')
  })

  it('returns topics for backend position', () => {
    const topics = getTopicsForPosition('backend')
    expect(topics.length).toBeGreaterThan(0)
    expect(topics).toContain('nodejs')
    expect(topics).toContain('database')
  })

  it('returns topics for fullstack position', () => {
    const topics = getTopicsForPosition('fullstack')
    // Fullstack should have the most topics (union of frontend + backend categories)
    const frontendTopics = getTopicsForPosition('frontend')
    const backendTopics = getTopicsForPosition('backend')
    expect(topics.length).toBeGreaterThanOrEqual(frontendTopics.length)
    expect(topics.length).toBeGreaterThanOrEqual(backendTopics.length)
  })

  it('returns topics for devops position', () => {
    const topics = getTopicsForPosition('devops')
    expect(topics.length).toBeGreaterThan(0)
    // Devops should include CS fundamentals and network
    expect(topics).toContain('network')
    expect(topics).toContain('algorithms')
  })

  it('returns topics in TOPICS order', () => {
    const topics = getTopicsForPosition('frontend')
    const topicIndices = topics.map((t) => TOPICS.indexOf(t))
    for (let i = 1; i < topicIndices.length; i++) {
      expect(topicIndices[i]).toBeGreaterThan(topicIndices[i - 1])
    }
  })

  it('returns no duplicate topics', () => {
    for (const position of POSITIONS) {
      const topics = getTopicsForPosition(position)
      const unique = new Set(topics)
      expect(unique.size).toBe(topics.length)
    }
  })

  it('only returns valid topics', () => {
    for (const position of POSITIONS) {
      const topics = getTopicsForPosition(position)
      for (const topic of topics) {
        expect(TOPICS).toContain(topic)
      }
    }
  })
})

describe('getCategoriesForPosition', () => {
  it('returns categories for frontend', () => {
    const categories = getCategoriesForPosition('frontend')
    expect(categories.length).toBeGreaterThan(0)
    const ids = categories.map((c) => c.id)
    expect(ids).toContain('js-core')
    expect(ids).toContain('web-platform')
  })

  it('returns categories for backend', () => {
    const categories = getCategoriesForPosition('backend')
    const ids = categories.map((c) => c.id)
    expect(ids).toContain('backend')
    expect(ids).toContain('async')
  })

  it('only returns categories that include the position', () => {
    for (const position of POSITIONS) {
      const categories = getCategoriesForPosition(position)
      for (const category of categories) {
        expect(category.positions).toContain(position)
      }
    }
  })

  it('returns a subset of all CATEGORIES', () => {
    for (const position of POSITIONS) {
      const categories = getCategoriesForPosition(position)
      for (const category of categories) {
        expect(CATEGORIES).toContainEqual(category)
      }
    }
  })
})

describe('getPositionTopicCount', () => {
  it('returns correct count for each position', () => {
    for (const position of POSITIONS) {
      const count = getPositionTopicCount(position)
      const topics = getTopicsForPosition(position)
      expect(count).toBe(topics.length)
    }
  })

  it('returns a positive number for all positions', () => {
    for (const position of POSITIONS) {
      expect(getPositionTopicCount(position)).toBeGreaterThan(0)
    }
  })
})

describe('createTopicFilter', () => {
  it('returns undefined when all topics are enabled', () => {
    expect(createTopicFilter([...TOPICS])).toBeUndefined()
  })

  it('returns the topic array when not all topics are enabled', () => {
    const subset = TOPICS.slice(0, 3)
    expect(createTopicFilter(subset)).toEqual(subset)
  })

  it('returns empty array for empty input', () => {
    expect(createTopicFilter([])).toEqual([])
  })

  it('returns the topics when one fewer than all', () => {
    const almostAll = TOPICS.slice(0, -1)
    expect(createTopicFilter(almostAll)).toEqual(almostAll)
  })
})
