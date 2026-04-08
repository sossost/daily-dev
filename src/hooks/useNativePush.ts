'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { getAPNsToken, isNativeApp } from '@/lib/native-bridge'
import { savePushToken } from '@/lib/supabase/push'

/**
 * Automatically registers the APNs token with Supabase
 * when running inside the React Native shell.
 * No-op in regular browsers.
 */
export function useNativePush(userId: string | null): void {
  const locale = useLocale()
  const hasRegistered = useRef(false)

  useEffect(() => {
    if (hasRegistered.current) return
    if (!isNativeApp()) return
    if (userId == null) return

    const apnsToken = getAPNsToken()
    if (apnsToken == null) return

    savePushToken(apnsToken, locale, 'ios').then((success) => {
      if (success) {
        hasRegistered.current = true
      }
    })
  }, [locale, userId])
}
