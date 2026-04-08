import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Mail } from 'lucide-react'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.pages.privacy' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

function SectionWithItems({
  title,
  items,
}: {
  title: string
  items: Record<string, string>
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <ul className="space-y-2">
        {Object.entries(items).map(([key, item]) => (
          <li
            key={key}
            className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SectionWithDescription({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </section>
  )
}

export default function PrivacyPage() {
  const t = useTranslations('privacy')
  const tc = useTranslations('common')

  const collectItems = {
    account: t('sections.collect.items.account'),
    learning: t('sections.collect.items.learning'),
    device: t('sections.collect.items.device'),
    usage: t('sections.collect.items.usage'),
  }

  const purposeItems = {
    service: t('sections.purpose.items.service'),
    reminders: t('sections.purpose.items.reminders'),
    progress: t('sections.purpose.items.progress'),
    srs: t('sections.purpose.items.srs'),
  }

  const rightsItems = {
    access: t('sections.rights.items.access'),
    delete: t('sections.rights.items.delete'),
    optOut: t('sections.rights.items.optOut'),
    export: t('sections.rights.items.export'),
  }

  return (
    <div>
      <header className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={tc('home')}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
      </header>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {t('lastUpdated')}
      </p>

      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
        {t('intro')}
      </p>

      <div className="space-y-8">
        <SectionWithItems
          title={t('sections.collect.title')}
          items={collectItems}
        />

        <SectionWithItems
          title={t('sections.purpose.title')}
          items={purposeItems}
        />

        <SectionWithDescription
          title={t('sections.storage.title')}
          description={t('sections.storage.description')}
        />

        <SectionWithDescription
          title={t('sections.sharing.title')}
          description={t('sections.sharing.description')}
        />

        <SectionWithItems
          title={t('sections.rights.title')}
          items={rightsItems}
        />

        <SectionWithDescription
          title={t('sections.deletion.title')}
          description={t('sections.deletion.description')}
        />

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('sections.contact.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            {t('sections.contact.description')}
          </p>
          <a
            href={`mailto:${t('contactEmail')}`}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Mail size={16} />
            {t('contactEmail')}
          </a>
        </section>
      </div>
    </div>
  )
}
