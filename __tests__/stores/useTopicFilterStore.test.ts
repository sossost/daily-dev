import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { TOPICS } from '@/types'
import { act } from '@testing-library/react'

describe('useTopicFilterStore', () => {
  beforeEach(() => {
    act(() => {
      useTopicFilterStore.setState({ enabledTopics: [...TOPICS] })
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
})
