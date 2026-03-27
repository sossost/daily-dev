import { SITE_URL } from '@/lib/constants'

function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

type JsonLdProps = {
  locale: string
}

export function JsonLd({ locale }: JsonLdProps) {
  const isKo = locale === 'ko'

  const webApplication = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DailyDev',
    url: SITE_URL,
    description: isKo
      ? '매일 5분, 개발 핵심 개념을 학습하고 실력을 키워보세요.'
      : 'Practice core development concepts in just 5 minutes a day.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    inLanguage: [locale],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: isKo
      ? [
          'SM-2 간격 반복 알고리즘',
          '23개 개발 토픽',
          '데일리/챌린지/무한/집중 모드',
          '클라우드 동기화',
          '푸시 알림',
        ]
      : [
          'SM-2 spaced repetition algorithm',
          '23 developer topics',
          'Daily / Challenge / Endless / Focus modes',
          'Cloud sync',
          'Push notifications',
        ],
  }

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DailyDev',
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    sameAs: [],
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: isKo
      ? [
          {
            '@type': 'Question',
            name: 'DailyDev는 무료인가요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '네, DailyDev는 완전히 무료입니다. 627개 이상의 개발 퀴즈를 무료로 학습할 수 있습니다.',
            },
          },
          {
            '@type': 'Question',
            name: '어떤 개발 주제를 학습할 수 있나요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'JavaScript, TypeScript, React, Node.js, 디자인 패턴, 알고리즘 등 23개의 핵심 개발 토픽을 학습할 수 있습니다.',
            },
          },
          {
            '@type': 'Question',
            name: '하루에 얼마나 시간이 필요한가요?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '하루 5분이면 충분합니다. 10문제로 구성된 데일리 세션을 통해 핵심 개념을 효율적으로 학습합니다.',
            },
          },
        ]
      : [
          {
            '@type': 'Question',
            name: 'Is DailyDev free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, DailyDev is completely free. You can practice with over 627 developer quiz questions at no cost.',
            },
          },
          {
            '@type': 'Question',
            name: 'What developer topics are covered?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'DailyDev covers 23 core developer topics including JavaScript, TypeScript, React, Node.js, design patterns, algorithms, and more.',
            },
          },
          {
            '@type': 'Question',
            name: 'How much time do I need per day?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Just 5 minutes a day. Each daily session consists of 10 questions designed for efficient learning using spaced repetition.',
            },
          },
        ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPage) }}
      />
    </>
  )
}
