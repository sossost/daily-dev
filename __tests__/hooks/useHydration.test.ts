import { renderHook, act, waitFor } from '@testing-library/react'
import { useHydration } from '@/hooks/useHydration'
import { useThemeStore } from '@/stores/useThemeStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'

const allStores = [
  useThemeStore.persist,
  useTopicFilterStore.persist,
]

function mockStores(hydrated: boolean) {
  const originals = allStores.map((p) => ({
    persist: p,
    origHasHydrated: p.hasHydrated,
    origOnFinish: p.onFinishHydration,
  }))

  const callbacks: Array<() => void> = []

  for (const o of originals) {
    o.persist.hasHydrated = () => hydrated
    o.persist.onFinishHydration = ((cb: () => void) => {
      callbacks.push(cb)
      return () => {}
    }) as typeof o.persist.onFinishHydration
  }

  const restore = () => {
    for (const o of originals) {
      o.persist.hasHydrated = o.origHasHydrated
      o.persist.onFinishHydration = o.origOnFinish
    }
  }

  return { callbacks, restore, setHydrated: (v: boolean) => {
    for (const o of originals) {
      o.persist.hasHydrated = () => v
    }
  }}
}

describe('useHydration', () => {
  it('returns false when stores have not yet hydrated', () => {
    const { restore } = mockStores(false)
    const { result } = renderHook(() => useHydration())

    expect(result.current).toBe(false)
    restore()
  })

  it('returns true when all stores are already hydrated', () => {
    const { restore } = mockStores(true)
    const { result } = renderHook(() => useHydration())

    expect(result.current).toBe(true)
    restore()
  })

  it('transitions to true when stores finish hydrating via callback', async () => {
    const { callbacks, restore, setHydrated } = mockStores(false)
    const { result } = renderHook(() => useHydration())

    expect(result.current).toBe(false)

    setHydrated(true)
    act(() => {
      for (const cb of callbacks) {
        cb()
      }
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
    restore()
  })
})
