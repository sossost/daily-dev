import { renderHook, act } from '@testing-library/react'
import { useHydration } from '@/hooks/useHydration'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'

type PersistApi = typeof useProgressStore.persist

describe('useHydration', () => {
  it('returns false initially when stores have not yet hydrated', () => {
    // Override hasHydrated to return false for all stores
    const originals = [
      useProgressStore.persist,
      useSessionStore.persist,
      useThemeStore.persist,
      useBookmarkStore.persist,
    ].map((p) => ({
      persist: p,
      original: p.hasHydrated,
    }))

    for (const o of originals) {
      o.persist.hasHydrated = () => false
    }

    const { result } = renderHook(() => useHydration())
    expect(result.current).toBe(false)

    // Restore
    for (const o of originals) {
      o.persist.hasHydrated = o.original
    }
  })

  it('returns true immediately when all stores report hydrated', () => {
    const stores = [
      useProgressStore.persist,
      useSessionStore.persist,
      useThemeStore.persist,
      useBookmarkStore.persist,
    ]

    const originals = stores.map((p) => ({
      persist: p,
      original: p.hasHydrated,
    }))

    for (const o of originals) {
      o.persist.hasHydrated = () => true
    }

    const { result } = renderHook(() => useHydration())

    // Effect runs synchronously with hasHydrated() === true
    expect(result.current).toBe(true)

    for (const o of originals) {
      o.persist.hasHydrated = o.original
    }
  })

  it('transitions to true when stores finish hydrating via callback', () => {
    const stores = [
      useProgressStore.persist,
      useSessionStore.persist,
      useThemeStore.persist,
      useBookmarkStore.persist,
    ]

    // Track onFinishHydration callbacks
    const callbacks: Array<() => void> = []
    const originals = stores.map((p) => ({
      persist: p,
      origHasHydrated: p.hasHydrated,
      origOnFinish: p.onFinishHydration,
    }))

    // First call: not hydrated. After callbacks fire: hydrated.
    let hydrated = false
    for (const o of originals) {
      o.persist.hasHydrated = () => hydrated
      o.persist.onFinishHydration = ((cb: () => void) => {
        callbacks.push(cb)
        return () => {}
      }) as typeof o.persist.onFinishHydration
    }

    const { result } = renderHook(() => useHydration())
    expect(result.current).toBe(false)

    // Simulate all stores finishing hydration
    hydrated = true
    act(() => {
      for (const cb of callbacks) {
        cb()
      }
    })

    expect(result.current).toBe(true)

    // Restore
    for (const o of originals) {
      o.persist.hasHydrated = o.origHasHydrated
      o.persist.onFinishHydration = o.origOnFinish
    }
  })

  it('cleans up onFinishHydration subscriptions on unmount', () => {
    const stores = [
      useProgressStore.persist,
      useSessionStore.persist,
      useThemeStore.persist,
      useBookmarkStore.persist,
    ]

    const unsubFns = stores.map(() => jest.fn())
    const originals = stores.map((p, i) => ({
      persist: p,
      origHasHydrated: p.hasHydrated,
      origOnFinish: p.onFinishHydration,
      unsubFn: unsubFns[i],
    }))

    for (const o of originals) {
      o.persist.hasHydrated = () => false
      o.persist.onFinishHydration = () => o.unsubFn
    }

    const { unmount } = renderHook(() => useHydration())
    unmount()

    for (const fn of unsubFns) {
      expect(fn).toHaveBeenCalledTimes(1)
    }

    // Restore
    for (const o of originals) {
      o.persist.hasHydrated = o.origHasHydrated
      o.persist.onFinishHydration = o.origOnFinish
    }
  })
})
