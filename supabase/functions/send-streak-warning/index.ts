// @ts-nocheck — Deno Edge Function, not part of the Next.js TypeScript project
// Supabase Edge Function: send-streak-warning
// Cron: every day at 11:00 UTC (20:00 KST)
// Purpose: Send FCM push to users who haven't studied today and have active push subscriptions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

// FCM v1 API — requires service account credentials
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? ''
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? ''

interface PushSubscription {
  id: string
  user_id: string
  fcm_token: string
  locale: string
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  en: {
    title: 'Your streak is at risk!',
    body: "You haven't studied today. Just 5 minutes to keep your streak going!",
  },
  ko: {
    title: '스트릭이 끊길 위험!',
    body: '오늘 아직 학습을 안 했어요. 5분만 투자해서 스트릭을 이어가세요!',
  },
}

/**
 * Get a short-lived OAuth 2.0 access token from a service account JSON.
 * Uses the JWT grant flow for Google APIs.
 */
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  const HOUR_IN_SECONDS = 3600

  // Build JWT header + claims
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + HOUR_IN_SECONDS,
  }))

  // Sign with the private key
  const encoder = new TextEncoder()
  const keyData = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signingInput = encoder.encode(`${header}.${claims}`)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signingInput)
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const jwt = `${header}.${claims}.${sig}`

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const data = await response.json()
  return data.access_token
}

/**
 * Send a single FCM v1 notification.
 */
async function sendFCMv1(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  title: string,
  body: string,
): Promise<boolean> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        data: { url: '/' },
      },
    }),
  })

  if (response.ok) return true

  const error = await response.json()
  // UNREGISTERED or INVALID_ARGUMENT means the token is dead
  const errorCode = error?.error?.details?.[0]?.errorCode ?? error?.error?.status ?? ''
  return errorCode !== 'UNREGISTERED' && errorCode !== 'INVALID_ARGUMENT'
    ? true  // transient error, don't deactivate
    : false // token is invalid
}

Deno.serve(async (req) => {
  // Verify the request is from Supabase cron with the correct secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const token = authHeader.slice('Bearer '.length)
  if (CRON_SECRET === '' || token !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  if (FCM_PROJECT_ID === '' || FCM_SERVICE_ACCOUNT_JSON === '') {
    return new Response(JSON.stringify({ error: 'FCM credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Get today's date in UTC
  const today = new Date().toISOString().split('T')[0]

  // Find users who have active push subscriptions
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, fcm_token, locale')
    .eq('is_active', true)

  if (subError != null || subscriptions == null) {
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: subError }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No active subscriptions' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get user progress to check who studied today
  const userIds = [...new Set(subscriptions.map((s) => s.user_id))]
  const { data: progressRecords } = await supabase
    .from('user_progress')
    .select('user_id, last_session_date')
    .in('user_id', userIds)

  const studiedTodaySet = new Set()
  if (progressRecords != null) {
    for (const record of progressRecords) {
      if (record.last_session_date === today) {
        studiedTodaySet.add(record.user_id)
      }
    }
  }

  // Filter to users who haven't studied today
  const targets = subscriptions.filter((s) => !studiedTodaySet.has(s.user_id))

  if (targets.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'All users studied today' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get OAuth access token for FCM v1 API
  const accessToken = await getAccessToken(FCM_SERVICE_ACCOUNT_JSON)

  // Send FCM notifications
  let sentCount = 0
  const failedTokenIds = []

  for (const target of targets) {
    const msg = MESSAGES[target.locale] ?? MESSAGES.en

    try {
      const success = await sendFCMv1(accessToken, FCM_PROJECT_ID, target.fcm_token, msg.title, msg.body)
      if (success) {
        sentCount++
      } else {
        failedTokenIds.push(target.id)
      }
    } catch {
      // Network error — don't deactivate, might be transient
    }
  }

  // Deactivate invalid tokens
  if (failedTokenIds.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', failedTokenIds)
  }

  return new Response(
    JSON.stringify({
      sent: sentCount,
      failed: failedTokenIds.length,
      total_targets: targets.length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
