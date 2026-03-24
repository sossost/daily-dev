/**
 * Waits for persisted Zustand stores to finish hydrating from localStorage.
 * Only theme and topic filter stores still use persist.
 * Progress, bookmark, and session stores are server-injected (no hydration).
 */
import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'

const stores = [
  useThemeStore.persist,
  useTopicFilterStore.persist,
]

const HYDRATION_TIMEOUT_MS = 500

function checkAllHydrated(): boolean {
  return stores.every((s) => s.hasHydrated())
}

export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(checkAllHydrated)

  useEffect(() => {
    if (isHydrated) return

    const unsubs = stores.map((s) =>
      s.onFinishHydration(() => {
        if (stores.every((store) => store.hasHydrated())) {
          setIsHydrated(true)
        }
      }),
    )

    const timeout = setTimeout(() => {
      setIsHydrated(true)
    }, HYDRATION_TIMEOUT_MS)

    return () => {
      unsubs.forEach((unsub) => unsub())
      clearTimeout(timeout)
    }
  }, [])

  return isHydrated
}
