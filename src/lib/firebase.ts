import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, type Messaging } from 'firebase/messaging'

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const

function getFirebaseApp(): FirebaseApp {
  const existingApps = getApps()
  if (existingApps.length > 0) return existingApps[0]
  return initializeApp(FIREBASE_CONFIG)
}

function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null

  try {
    const app = getFirebaseApp()
    return getMessaging(app)
  } catch {
    return null
  }
}

/**
 * Request FCM push token from the browser.
 * Returns the token string or null if unavailable/denied.
 */
export async function requestFCMToken(): Promise<string | null> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (vapidKey == null || vapidKey === '') return null

  const messaging = getFirebaseMessaging()
  if (messaging == null) return null

  try {
    const registration = await navigator.serviceWorker.getRegistration('/')
      ?? await navigator.serviceWorker.register('/sw.js')

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })

    return token !== '' ? token : null
  } catch {
    return null
  }
}

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}
