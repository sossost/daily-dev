'use client'

import { createElement, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore, resolveTheme } from '@/stores/useThemeStore'

type ThemeMode = 'light' | 'dark' | 'system'

const MODES: ReadonlyArray<{ value: ThemeMode; Icon: typeof Sun; labelKey: 'lightMode' | 'darkMode' | 'systemMode' }> = [
  { value: 'light', Icon: Sun, labelKey: 'lightMode' },
  { value: 'dark', Icon: Moon, labelKey: 'darkMode' },
  { value: 'system', Icon: Monitor, labelKey: 'systemMode' },
] as const

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const t = useTranslations('settings')

  useEffect(() => {
    const root = document.documentElement
    const resolved = resolveTheme(mode)
    root.classList.toggle('dark', resolved === 'dark')
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') {
      return
    }

    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        const resolved = resolveTheme('system')
        document.documentElement.classList.toggle('dark', resolved === 'dark')
      }

      mql.addEventListener('change', handler)
      return () => {
        mql.removeEventListener('change', handler)
      }
    } catch {
      // matchMedia unavailable (e.g. KakaoTalk in-app browser)
    }
  }, [mode])

  return createElement(
    'div',
    {
      className: 'flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
      role: 'radiogroup',
      'aria-label': t('theme'),
    },
    ...MODES.map(({ value, Icon, labelKey }) =>
      createElement(
        'button',
        {
          key: value,
          role: 'radio',
          'aria-checked': mode === value,
          'aria-label': t(labelKey),
          onClick: () => setMode(value),
          className:
            mode === value
              ? 'p-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm transition-colors'
              : 'p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors',
        },
        createElement(Icon, { className: 'w-4 h-4' }),
      ),
    ),
  )
}
