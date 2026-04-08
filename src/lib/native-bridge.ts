/**
 * Native bridge — communicates with the React Native WebView shell.
 * Messages are sent via postMessage and ignored when running in a browser.
 */

type HapticStyle = 'success' | 'error'

type NativeMessage =
  | { type: 'haptic'; payload: { style: HapticStyle } }
  | { type: 'appleSignIn' }

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    /** APNs device token injected by the React Native shell */
    __DAILYDEV_APNS_TOKEN__?: string
    /** Platform identifier injected by the React Native shell */
    __DAILYDEV_PLATFORM__?: 'ios'
    /** Apple ID token injected by the React Native shell after native Apple Sign In */
    __DAILYDEV_APPLE_ID_TOKEN__?: string
  }
}

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && window.ReactNativeWebView != null
}

export function postNativeMessage(message: NativeMessage): void {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message))
}

export function triggerHaptic(style: HapticStyle): void {
  postNativeMessage({ type: 'haptic', payload: { style } })
}

/**
 * Get the APNs token injected by the React Native shell.
 * Returns null when running in a regular browser.
 */
export function getAPNsToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.__DAILYDEV_APNS_TOKEN__ ?? null
}

/**
 * Get the platform identifier injected by the React Native shell.
 */
export function getNativePlatform(): 'ios' | null {
  if (typeof window === 'undefined') return null
  return window.__DAILYDEV_PLATFORM__ ?? null
}
