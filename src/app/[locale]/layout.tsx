import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SentryProvider } from '@/components/SentryProvider'
import { ToastProvider } from '@/components/ToastProvider'
import { DataProvider } from '@/components/DataProvider'
import { ScrollToTop } from '@/components/ScrollToTop'
import { getUserId } from '@/lib/supabase/getUserId'
import { loadServerUserData } from '@/lib/supabase/loadUserData'
import { SITE_URL } from '@/lib/constants'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const alternateLanguages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
  )

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: SITE_URL,
      siteName: 'DailyDev',
      images: [
        { url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: t('title') },
      ],
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${SITE_URL}/og.png`],
    },
    alternates: {
      languages: alternateLanguages,
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  let initialData = null
  let isAuthenticated = false
  let userId: string | null = null
  try {
    const identity = await getUserId()
    if (identity != null) {
      userId = identity.id
      isAuthenticated = identity.type === 'auth'
      initialData = await loadServerUserData(identity.id)
    }
  } catch {
    // Supabase unavailable — continue with empty state
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_GA_ID != null && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=JSON.parse(localStorage.getItem('daily-dev-theme')||'{}');var mode=m.state&&m.state.mode||'system';var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen antialiased transition-colors">
        <SentryProvider>
          <NextIntlClientProvider messages={messages}>
            <ErrorBoundary>
              <ScrollToTop />
              <DataProvider userId={userId} isAuthenticated={isAuthenticated} initialData={initialData}>
                <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
                <ToastProvider />
              </DataProvider>
            </ErrorBoundary>
          </NextIntlClientProvider>
        </SentryProvider>
      </body>
    </html>
  )
}
