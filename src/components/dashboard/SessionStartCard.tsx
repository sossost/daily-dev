'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function SessionStartCard() {
  const t = useTranslations('session')

  return (
    <Link
      href="/session"
      className="block bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-center text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
    >
      <h2 className="text-xl font-bold mb-1">{t('start')}</h2>
      <p className="text-sm text-blue-100">{t('startDescription')}</p>
    </Link>
  )
}
