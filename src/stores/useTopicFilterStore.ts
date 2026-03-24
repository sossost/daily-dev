/**
 * Topic filter store — controls which topics appear in SRS sessions.
 * Persisted to localStorage so filter preferences survive across sessions.
 * When all topics are enabled (default), the SRS session works as before.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TOPICS, type Topic } from '@/types'

interface TopicFilterState {
  readonly enabledTopics: readonly Topic[]
  toggleTopic: (topic: Topic) => void
  enableAll: () => void
  disableAll: () => void
  isEnabled: (topic: Topic) => boolean
  isAllEnabled: () => boolean
}

export const useTopicFilterStore = create<TopicFilterState>()(
  persist(
    (set, get) => ({
      enabledTopics: [...TOPICS] as readonly Topic[],

      toggleTopic: (topic) => {
        const { enabledTopics } = get()
        const exists = enabledTopics.includes(topic)
        set({
          enabledTopics: exists
            ? enabledTopics.filter((t) => t !== topic)
            : [...enabledTopics, topic],
        })
      },

      enableAll: () => {
        set({ enabledTopics: [...TOPICS] })
      },

      disableAll: () => {
        set({ enabledTopics: [] })
      },

      isEnabled: (topic) => {
        return get().enabledTopics.includes(topic)
      },

      isAllEnabled: () => {
        return get().enabledTopics.length === TOPICS.length
      },
    }),
    {
      name: 'daily-dev-topic-filter',
    },
  ),
)
