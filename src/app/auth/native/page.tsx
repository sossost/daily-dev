'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Lightweight page opened by the native app in SFSafariViewController.
 * Initiates OAuth flow entirely within the browser context so that
 * PKCE verifier and callback share the same cookie jar.
 *
 * URL: /auth/native?provider=google|github|apple
 * After auth: redirects to /auth/callback?native=true → deep link back to app
 */
export default function NativeAuthPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const provider = params.get('provider') as 'google' | 'github' | 'apple' | null

    if (provider == null) return

    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?native=true`,
      },
    })
  }, [])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#F9FAFB',
    }}>
      <p style={{ color: '#6B7280', fontSize: 14 }}>Redirecting...</p>
    </div>
  )
}
