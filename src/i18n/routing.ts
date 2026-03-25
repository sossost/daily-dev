import { defineRouting } from 'next-intl/routing'

export type Locale = 'en' | 'ko'

export const routing = defineRouting({
  locales: ['en', 'ko'] as const,
  defaultLocale: 'en' as const,
  localePrefix: 'as-needed',
})

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value)
}
