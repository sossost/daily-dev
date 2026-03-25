'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[]
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptState {
  /** Whether the browser supports installation (beforeinstallprompt fired) */
  isInstallable: boolean
  /** Whether the app is already running in standalone mode */
  isInstalled: boolean
  /** Whether this is iOS (needs manual install instructions) */
  isIOS: boolean
  /** Trigger the install prompt */
  install: () => Promise<void>
}

export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    setIsInstalled(isStandalone)

    // Detect iOS (all iOS browsers use WebKit and support Add to Home Screen)
    const ua = window.navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua)
    setIsIOS(isiOS && !isStandalone)

    // Listen for beforeinstallprompt
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (deferredPrompt == null) return

    const result = await deferredPrompt.prompt()
    if (result.outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  return {
    isInstallable: deferredPrompt != null,
    isInstalled,
    isIOS,
    install,
  }
}
