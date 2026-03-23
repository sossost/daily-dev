/** Sentry client-side initialization for error tracking. */
import * as Sentry from '@sentry/react'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? ''

export function initSentry() {
  if (SENTRY_DSN === '' || SENTRY_DSN === 'YOUR_SENTRY_DSN_HERE') return

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    })
  } catch {
    // Sentry init failed — app continues without error tracking
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  try {
    Sentry.captureException(error, { extra: context })
  } catch {
    // Sentry unavailable — silently fail
  }
}
