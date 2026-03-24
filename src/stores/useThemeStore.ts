/** Theme store — user preference for light/dark/system mode. Persisted to localStorage. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system' as ThemeMode,

      setMode: (mode) => {
        set({ mode })
      },
    }),
    {
      name: 'daily-dev-theme',
    },
  ),
)

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'light'
  }
  return mode
}
