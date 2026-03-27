import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { buildLocaleUrl } from '@/lib/buildLocaleUrl'

/** Public pages only — user-specific pages (history, stats, bookmarks, schedule, wrong-answers) are noIndex. */
const INDEXABLE_ROUTES = [
  '',
  '/session',
  '/practice',
  '/focus',
  '/topics',
  '/challenge',
  '/endless',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((route) => {
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
