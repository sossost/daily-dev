/**
 * Waits for all persisted Zustand stores to finish hydrating from storage.
 * Falls back to default state after HYDRATION_TIMEOUT_MS if storage is
 * blocked (e.g. KakaoTalk in-app browser, private browsing).
 */
import { useEffect, useState } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useBookmarkStore } from '@/stores/useBookmarkStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'

const stores = [
  useProgressStore.persist,
  useSessionStore.persist,
  useThemeStore.persist,
  useBookmarkStore.persist,
  useTopicFilterStore.persist,
]

const HYDRATION_TIMEOUT_MS = 500

export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (stores.every((s) => s.hasHydrated())) {
      setIsHydrated(true)
      return
    }

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
