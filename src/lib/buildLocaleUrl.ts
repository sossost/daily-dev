import { SITE_URL } from '@/lib/constants'
import { routing } from '@/i18n/routing'

export function buildLocaleUrl(locale: string, path: string = '/'): string {
  const isDefault = locale === routing.defaultLocale
  const prefix = isDefault ? '' : `/${locale}`
  const normalizedPath = path === '' ? '/' : path
  return `${SITE_URL}${prefix}${normalizedPath}`
}
