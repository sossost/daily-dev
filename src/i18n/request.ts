import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import type { Locale } from './routing'
import { routing } from './routing'

type MessageModule = { default: Record<string, unknown> }

const MESSAGES: Record<Locale, () => Promise<MessageModule>> = {
  en: () => import('../../messages/en.json'),
  ko: () => import('../../messages/ko.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await MESSAGES[locale]()).default,
  }
})
