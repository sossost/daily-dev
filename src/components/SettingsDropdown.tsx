'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu, Sun, Moon, Monitor, LogIn, LogOut, Filter } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useThemeStore, resolveTheme } from '@/stores/useThemeStore'
import { useTopicFilterStore } from '@/stores/useTopicFilterStore'
import { useAuth } from '@/hooks/useAuth'
import { getIsAuthenticated } from '@/lib/supabase/currentUser'
import { LoginModal } from '@/components/LoginModal'
import { TopicFilterModal } from '@/components/TopicFilterModal'
import { useRouter, usePathname } from '@/i18n/navigation'
import { isLocale, type Locale } from '@/i18n/routing'
import { TOPICS } from '@/types'

type ThemeMode = 'light' | 'dark' | 'system'

const THEME_MODES: ReadonlyArray<{
  value: ThemeMode
  Icon: typeof Sun
  labelKey: 'lightMode' | 'darkMode' | 'systemMode'
}> = [
  { value: 'light', Icon: Sun, labelKey: 'lightMode' },
  { value: 'dark', Icon: Moon, labelKey: 'darkMode' },
  { value: 'system', Icon: Monitor, labelKey: 'systemMode' },
]

const LOCALES: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: 'en', label: 'EN' },
  { value: 'ko', label: 'KO' },
]

export function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const filterT = useTranslations('topicFilter')
  const onboardingT = useTranslations('onboarding')
  const rawLocale = useLocale()
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const router = useRouter()
  const pathname = usePathname()
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const selectedPosition = useTopicFilterStore((s) => s.selectedPosition)
  const enabledTopicCount = useTopicFilterStore((s) => s.enabledTopics.length)

  const { user, signInWithGoogle, signInWithGitHub, signOut } = useAuth()
  const isAuthenticated = getIsAuthenticated()
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const userName = (user?.user_metadata?.full_name as string | undefined) ?? 'User'

  // Theme side effects
  useEffect(() => {
    const resolved = resolveTheme(mode)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        const resolved = resolveTheme('system')
        document.documentElement.classList.toggle('dark', resolved === 'dark')
      }
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    } catch {
      // matchMedia unavailable
    }
  }, [mode])

  // Close on outside click
  useEffect(() => {
    if (isOpen === false) return
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current != null && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (isOpen === false) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function handleLocaleChange(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale })
    setIsOpen(false)
  }

  function handleSignOut() {
    setIsOpen(false)
    signOut()
  }

  function handleLogin() {
    setIsOpen(false)
    setIsLoginOpen(true)
  }

  function handleOpenFilter() {
    setIsOpen(false)
    setIsFilterOpen(true)
  }

  const positionLabel = selectedPosition != null
    ? onboardingT(selectedPosition)
    : filterT('allTopics')

  const triggerButton = (
    <button
      onClick={() => setIsOpen((prev) => !prev)}
      className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={t('label')}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Menu className="w-6 h-6" />
    </button>
  )

  return (
    <div ref={dropdownRef} className="relative">
      {triggerButton}

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-3 z-50"
          role="menu"
          aria-label={t('label')}
        >
          {/* Profile Section (logged in) */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-1 pb-4 mb-3 border-b border-gray-100 dark:border-gray-700">
              {avatarUrl != null ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-7 h-7 rounded-full shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {userName}
              </span>
            </div>
          )}

          {/* Theme Section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('theme')}
            </p>
            <div
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
              role="radiogroup"
              aria-label={t('theme')}
            >
              {THEME_MODES.map(({ value, Icon, labelKey }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={mode === value}
                  aria-label={t(labelKey)}
                  onClick={() => setMode(value)}
                  className={
                    mode === value
                      ? 'flex-1 flex items-center justify-center p-1.5 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm transition-colors'
                      : 'flex-1 flex items-center justify-center p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                  }
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Language Section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('language')}
            </p>
            <div
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1"
              role="radiogroup"
              aria-label={t('language')}
            >
              {LOCALES.map(({ value, label }) => (
                <button
                  key={value}
                  role="radio"
                  aria-checked={locale === value}
                  onClick={() => handleLocaleChange(value)}
                  className={
                    locale === value
                      ? 'flex-1 text-center text-sm font-medium p-1.5 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm transition-colors'
                      : 'flex-1 text-center text-sm font-medium p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Filter Section */}
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {filterT('title')}
            </p>
            <button
              type="button"
              onClick={handleOpenFilter}
              className="flex items-center gap-2 w-full px-2.5 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              role="menuitem"
            >
              <Filter size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {positionLabel}
              </span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {enabledTopicCount}/{TOPICS.length}
              </span>
            </button>
          </div>

          {/* Auth Section */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                role="menuitem"
              >
                <LogOut size={16} />
                {tc('logout')}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                role="menuitem"
              >
                <LogIn size={16} />
                {tc('login')}
              </button>
            )}
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onGoogle={signInWithGoogle}
        onGitHub={signInWithGitHub}
      />
      <TopicFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  )
}
