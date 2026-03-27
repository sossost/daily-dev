import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_URL } from '@/lib/constants'
import { routing } from '@/i18n/routing'
import { buildLocaleUrl } from '@/lib/buildLocaleUrl'

type PageKey =
  | 'session'
  | 'stats'
  | 'topics'
  | 'history'
  | 'bookmarks'
  | 'schedule'
  | 'practice'
  | 'focus'
  | 'challenge'
  | 'endless'
  | 'wrongAnswers'

type Options = {
  noIndex?: boolean
}

export async function generatePageMetadata(
  locale: string,
  pageKey: PageKey,
  path: string,
  options: Options = {},
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata.pages' })
  const title = t(`${pageKey}.title`)
  const description = t(`${pageKey}.description`)

  const alternateLanguages = Object.fromEntries(
    routing.locales.map((l) => [l, buildLocaleUrl(l, path)]),
  )

  return {
    title,
    description,
    ...(options.noIndex === true && {
      robots: { index: false, follow: false },
    }),
    openGraph: {
      title,
      description,
      url: buildLocaleUrl(locale, path),
      siteName: 'DailyDev',
      images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630 }],
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og.png`],
    },
    alternates: {
      canonical: buildLocaleUrl(locale, path),
      languages: alternateLanguages,
    },
  }
}
