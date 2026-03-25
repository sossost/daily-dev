import type { MetadataRoute } from 'next'
import type { Locale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/constants'

const STATIC_ROUTES = [
  '',
  '/session',
  '/history',
  '/stats',
  '/schedule',
  '/bookmarks',
  '/practice',
  '/focus',
  '/topics',
  '/challenge',
  '/wrong-answers',
]

function buildLocaleUrl(locale: Locale, route: string): string {
  const path = locale === routing.defaultLocale
    ? (route || '/')
    : `/${locale}${route}`
  return `${SITE_URL}${path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, buildLocaleUrl(locale, route)]),
    )

    return {
      url: buildLocaleUrl(routing.defaultLocale, route),
      lastModified: new Date(),
      alternates: { languages },
    }
  })
}
