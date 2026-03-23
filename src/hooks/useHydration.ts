/** Waits for all persisted Zustand stores to finish hydrating from storage. */
import { useEffect, useState } from 'react'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSessionStore } from '@/stores/useSessionStore'
import { useThemeStore } from '@/stores/useThemeStore'

const stores = [
  useProgressStore.persist,
  useSessionStore.persist,
  useThemeStore.persist,
]

export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(() =>
    stores.every((s) => s.hasHydrated()),
  )

  useEffect(() => {
    if (isHydrated) return

    const unsubs = stores.map((s) =>
      s.onFinishHydration(() => {
        if (stores.every((store) => store.hasHydrated())) {
          setIsHydrated(true)
        }
      }),
    )

    return () => unsubs.forEach((unsub) => unsub())
  }, [isHydrated])

  return isHydrated
}
