import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { CATEGORIES, TOPICS } from '@/types'
import { act } from '@testing-library/react'

describe('useTopicFilterStore', () => {
  beforeEach(() => {
    act(() => {
      useTopicFilterStore.setState({
        enabledTopics: [...TOPICS],
        selectedPosition: null,
        isOnboardingComplete: false,
      })
    })
  })

  it('starts with all topics enabled', () => {
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).toEqual([...TOPICS])
  })

  it('toggles a topic off', () => {
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).not.toContain('scope')
    expect(enabledTopics.length).toBe(TOPICS.length - 1)
  })

  it('toggles a topic back on', () => {
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).toContain('scope')
  })

  it('clears selectedPosition when toggling a topic', () => {
    act(() => {
      useTopicFilterStore.setState({ selectedPosition: 'frontend' })
    })
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    expect(useTopicFilterStore.getState().selectedPosition).toBeNull()
  })

  it('disables all topics', () => {
    act(() => {
      useTopicFilterStore.getState().disableAll()
    })
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).toEqual([])
  })

  it('enables all topics', () => {
    act(() => {
      useTopicFilterStore.getState().disableAll()
    })
    act(() => {
      useTopicFilterStore.getState().enableAll()
    })
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).toEqual([...TOPICS])
  })

  it('enableAll clears selectedPosition', () => {
    act(() => {
      useTopicFilterStore.setState({ selectedPosition: 'frontend' })
    })
    act(() => {
      useTopicFilterStore.getState().enableAll()
    })
    expect(useTopicFilterStore.getState().selectedPosition).toBeNull()
  })

  it('disableAll clears selectedPosition', () => {
    act(() => {
      useTopicFilterStore.setState({ selectedPosition: 'frontend' })
    })
    act(() => {
      useTopicFilterStore.getState().disableAll()
    })
    expect(useTopicFilterStore.getState().selectedPosition).toBeNull()
  })

  it('isEnabled returns correct state', () => {
    act(() => {
      useTopicFilterStore.getState().toggleTopic('closure')
    })
    expect(useTopicFilterStore.getState().isEnabled('closure')).toBe(false)
    expect(useTopicFilterStore.getState().isEnabled('scope')).toBe(true)
  })

  it('isAllEnabled returns true when all topics are enabled', () => {
    expect(useTopicFilterStore.getState().isAllEnabled()).toBe(true)
  })

  it('isAllEnabled returns false when some topics are disabled', () => {
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    expect(useTopicFilterStore.getState().isAllEnabled()).toBe(false)
  })

  it('toggling one topic does not affect others', () => {
    act(() => {
      useTopicFilterStore.getState().toggleTopic('scope')
    })
    act(() => {
      useTopicFilterStore.getState().toggleTopic('closure')
    })
    const { enabledTopics } = useTopicFilterStore.getState()
    expect(enabledTopics).not.toContain('scope')
    expect(enabledTopics).not.toContain('closure')
    expect(enabledTopics).toContain('prototype')
  })

  describe('toggleCategory', () => {
    it('disables all topics in a category when all are enabled', () => {
      const jsCore = CATEGORIES.find((c) => c.id === 'js-core')!
      act(() => {
        useTopicFilterStore.getState().toggleCategory(jsCore.topics)
      })
      const { enabledTopics } = useTopicFilterStore.getState()
      for (const topic of jsCore.topics) {
        expect(enabledTopics).not.toContain(topic)
      }
    })

    it('enables all topics in a category when some are disabled', () => {
      const jsCore = CATEGORIES.find((c) => c.id === 'js-core')!
      // Disable one topic from the category first
      act(() => {
        useTopicFilterStore.getState().toggleTopic(jsCore.topics[0])
      })
      act(() => {
        useTopicFilterStore.getState().toggleCategory(jsCore.topics)
      })
      const { enabledTopics } = useTopicFilterStore.getState()
      for (const topic of jsCore.topics) {
        expect(enabledTopics).toContain(topic)
      }
    })

    it('clears selectedPosition when toggling a category', () => {
      act(() => {
        useTopicFilterStore.setState({ selectedPosition: 'frontend' })
      })
      const jsCore = CATEGORIES.find((c) => c.id === 'js-core')!
      act(() => {
        useTopicFilterStore.getState().toggleCategory(jsCore.topics)
      })
      expect(useTopicFilterStore.getState().selectedPosition).toBeNull()
    })
  })

  describe('togglePositionTopics', () => {
    it('enables all topics for a position and sets selectedPosition', () => {
      act(() => {
        useTopicFilterStore.getState().disableAll()
      })
      act(() => {
        useTopicFilterStore.getState().togglePositionTopics('frontend')
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBe('frontend')

      // All frontend topics should be enabled
      const frontendTopics = new Set<string>()
      for (const category of CATEGORIES) {
        if (category.positions.includes('frontend')) {
          for (const topic of category.topics) {
            frontendTopics.add(topic)
          }
        }
      }
      for (const topic of frontendTopics) {
        expect(state.enabledTopics).toContain(topic)
      }
    })

    it('disables all position topics when all are already enabled', () => {
      // Start with all enabled, toggle frontend off
      act(() => {
        useTopicFilterStore.getState().togglePositionTopics('frontend')
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBeNull()

      // Frontend-only topics should be disabled
      const frontendTopics = new Set<string>()
      for (const category of CATEGORIES) {
        if (category.positions.includes('frontend')) {
          for (const topic of category.topics) {
            frontendTopics.add(topic)
          }
        }
      }
      for (const topic of frontendTopics) {
        expect(state.enabledTopics).not.toContain(topic)
      }
    })
  })

  describe('applyFilter', () => {
    it('sets position and enabled topics', () => {
      act(() => {
        useTopicFilterStore.getState().applyFilter('backend', ['async', 'nodejs'])
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBe('backend')
      expect(state.enabledTopics).toEqual(['async', 'nodejs'])
    })

    it('accepts null position', () => {
      act(() => {
        useTopicFilterStore.getState().applyFilter(null, ['scope', 'closure'])
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBeNull()
      expect(state.enabledTopics).toEqual(['scope', 'closure'])
    })
  })

  describe('completeOnboarding', () => {
    it('sets position, topics, and marks onboarding complete', () => {
      act(() => {
        useTopicFilterStore.getState().completeOnboarding('frontend', ['scope', 'closure', 'react-basics'])
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBe('frontend')
      expect(state.enabledTopics).toEqual(['scope', 'closure', 'react-basics'])
      expect(state.isOnboardingComplete).toBe(true)
    })

    it('accepts null position', () => {
      act(() => {
        useTopicFilterStore.getState().completeOnboarding(null, [...TOPICS])
      })
      const state = useTopicFilterStore.getState()
      expect(state.selectedPosition).toBeNull()
      expect(state.isOnboardingComplete).toBe(true)
    })
  })
})
