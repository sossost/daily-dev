/**
 * Topic filter store — controls which topics appear across the app.
 * Persisted to localStorage so filter preferences survive across sessions.
 * Also stores onboarding state and selected position.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORIES, TOPICS, type Position, type Topic } from '@/types'

interface TopicFilterState {
  readonly enabledTopics: readonly Topic[]
  readonly selectedPosition: Position | null
  readonly isOnboardingComplete: boolean

  toggleTopic: (topic: Topic) => void
  toggleCategory: (topics: readonly Topic[]) => void
  togglePositionTopics: (position: Position) => void
  enableAll: () => void
  disableAll: () => void
  isEnabled: (topic: Topic) => boolean
  isAllEnabled: () => boolean
  applyFilter: (position: Position | null, topics: readonly Topic[]) => void
  completeOnboarding: (position: Position | null, topics: readonly Topic[]) => void
}

export const useTopicFilterStore = create<TopicFilterState>()(
  persist(
    (set, get) => ({
      enabledTopics: [...TOPICS] as readonly Topic[],
      selectedPosition: null,
      isOnboardingComplete: false,

      toggleTopic: (topic) => {
        const { enabledTopics } = get()
        const exists = enabledTopics.includes(topic)
        set({
          enabledTopics: exists
            ? enabledTopics.filter((t) => t !== topic)
            : [...enabledTopics, topic],
          selectedPosition: null,
        })
      },

      toggleCategory: (topics) => {
        const { enabledTopics } = get()
        const enabledSet = new Set(enabledTopics)
        const topicsSet = new Set(topics)
        const allEnabled = topics.every((t) => enabledSet.has(t))

        set({
          enabledTopics: allEnabled
            ? enabledTopics.filter((t) => !topicsSet.has(t))
            : [...enabledTopics, ...topics.filter((t) => !enabledSet.has(t))],
          selectedPosition: null,
        })
      },

      togglePositionTopics: (position) => {
        const { enabledTopics } = get()
        const enabledSet = new Set(enabledTopics)

        // Gather all topics for this position from CATEGORIES
        const positionTopics = new Set<Topic>()
        for (const category of CATEGORIES) {
          if (category.positions.includes(position)) {
            for (const topic of category.topics) {
              positionTopics.add(topic)
            }
          }
        }

        const allEnabled = [...positionTopics].every((t) => enabledSet.has(t))

        if (allEnabled) {
          // Disable all position topics
          set({
            enabledTopics: enabledTopics.filter((t) => !positionTopics.has(t)),
            selectedPosition: null,
          })
        } else {
          // Enable all position topics → set this as selected position
          const toAdd = [...positionTopics].filter((t) => !enabledSet.has(t))
          set({
            enabledTopics: [...enabledTopics, ...toAdd],
            selectedPosition: position,
          })
        }
      },

      enableAll: () => {
        set({ enabledTopics: [...TOPICS], selectedPosition: null })
      },

      disableAll: () => {
        set({ enabledTopics: [], selectedPosition: null })
      },

      isEnabled: (topic) => {
        return get().enabledTopics.includes(topic)
      },

      isAllEnabled: () => {
        return get().enabledTopics.length === TOPICS.length
      },

      applyFilter: (position, topics) => {
        set({
          selectedPosition: position,
          enabledTopics: [...topics],
        })
      },

      completeOnboarding: (position, topics) => {
        set({
          selectedPosition: position,
          enabledTopics: [...topics],
          isOnboardingComplete: true,
        })
      },
    }),
    {
      name: 'daily-dev-topic-filter',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<TopicFilterState>),
      }),
    },
  ),
)
