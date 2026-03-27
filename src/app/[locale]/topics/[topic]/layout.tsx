import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { TOPICS } from '@/types'
import { SITE_URL } from '@/lib/constants'
import { buildLocaleUrl } from '@/lib/buildLocaleUrl'
import { routing } from '@/i18n/routing'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string; topic: string }>
}

export async function generateStaticParams() {
  return TOPICS.map((topic) => ({ topic }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, topic } = await params
  const t = await getTranslations({ locale, namespace: 'topics' })
  const td = await getTranslations({ locale, namespace: 'topics.detail' })

  const isValidTopic = (TOPICS as readonly string[]).includes(topic)
  if (!isValidTopic) {
    return { title: 'Not Found' }
  }

  const topicName = t.has(topic) ? t(topic) : topic
  const descriptionKey = `description.${topic}` as const
  const description = td.has(descriptionKey)
    ? td(descriptionKey)
    : `Practice ${topicName} questions on DailyDev`
  const path = `/topics/${topic}`
  const title = `${topicName} Quiz | DailyDev`

  const alternateLanguages = Object.fromEntries(
    routing.locales.map((l) => [l, buildLocaleUrl(l, path)]),
  )

  return {
    title,
    description,
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

export default function Layout({ children }: Props) {
  return children
}
