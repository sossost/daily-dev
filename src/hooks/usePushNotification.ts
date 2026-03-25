'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { isPushSupported, requestFCMToken } from '@/lib/firebase'
import { savePushToken, deactivatePushToken, getPushStatus } from '@/lib/supabase/push'
import { getCurrentUserId } from '@/lib/supabase/currentUser'

export const FCM_TOKEN_KEY = 'daily-dev-fcm-token'

interface PushNotificationState {
  /** Whether the browser supports push notifications */
  isSupported: boolean
  /** Whether push notifications are currently enabled */
  isEnabled: boolean
  /** Whether an enable/disable operation is in progress */
  isLoading: boolean
  /** Whether the user has denied notification permission in browser settings */
  isDenied: boolean
  /** Enable push notifications (requests permission + saves token) */
  enable: () => Promise<'granted' | 'denied' | 'failed'>
  /** Disable push notifications (deactivates token) */
  disable: () => Promise<void>
}

export function usePushNotification(): PushNotificationState {
  const locale = useLocale()
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDenied, setIsDenied] = useState(false)

  useEffect(() => {
    const supported = isPushSupported()
    setIsSupported(supported)

    if (!supported) return

    // Check current permission state
    setIsDenied(Notification.permission === 'denied')

    // Check if user has an active push subscription
    const userId = getCurrentUserId()
    if (userId != null) {
      getPushStatus().then(setIsEnabled)
    }
  }, [])

  const enable = useCallback(async (): Promise<'granted' | 'denied' | 'failed'> => {
    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setIsDenied(true)
        return 'denied'
      }
      if (permission !== 'granted') {
        return 'failed'
      }

      // Clean up any previously stored stale token
      const prevToken = localStorage.getItem(FCM_TOKEN_KEY)
      if (prevToken != null) {
        await deactivatePushToken(prevToken)
      }

      const token = await requestFCMToken()
      if (token == null) return 'failed'

      const saved = await savePushToken(token, locale)
      if (saved === false) return 'failed'

      localStorage.setItem(FCM_TOKEN_KEY, token)
      setIsEnabled(true)
      setIsDenied(false)
      return 'granted'
    } catch {
      return 'failed'
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  const disable = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem(FCM_TOKEN_KEY)
      if (token != null) {
        await deactivatePushToken(token)
        localStorage.removeItem(FCM_TOKEN_KEY)
      }
      setIsEnabled(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    isEnabled,
    isLoading,
    isDenied,
    enable,
    disable,
  }
}
