import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { buildLocaleUrl } from '@/lib/buildLocaleUrl'
import { TOPICS } from '@/types'

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

function buildEntry(route: string): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, buildLocaleUrl(locale, route)]),
  )

  return {
    url: buildLocaleUrl(routing.defaultLocale, route),
    lastModified: new Date(),
    alternates: { languages },
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = INDEXABLE_ROUTES.map(buildEntry)
  const topicEntries = TOPICS.map((topic) => buildEntry(`/topics/${topic}`))

  return [...staticEntries, ...topicEntries]
}
