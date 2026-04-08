// @ts-nocheck — Deno Edge Function, not part of the Next.js TypeScript project
// Supabase Edge Function: send-streak-warning
// Cron: every day at 11:00 UTC (20:00 KST)
// Purpose: Send push notifications to users who haven't studied today
// Supports both FCM (web) and APNs (iOS)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? ''

// FCM v1 API — requires service account credentials
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? ''
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON') ?? ''

// APNs — requires Apple Auth Key (.p8)
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID') ?? ''
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID') ?? ''
const APNS_PRIVATE_KEY = Deno.env.get('APNS_PRIVATE_KEY') ?? ''
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID') ?? ''

interface PushSubscription {
  id: string
  user_id: string
  token: string
  platform: 'web' | 'ios'
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

// ─── FCM ───────────────────────────────────────────────

/**
 * Get a short-lived OAuth 2.0 access token from a service account JSON.
 * Uses the JWT grant flow for Google APIs.
 */
async function getFCMAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  const HOUR_IN_SECONDS = 3600

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const claims = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + HOUR_IN_SECONDS,
  }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = await signRS256(`${header}.${claims}`, sa.private_key)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Failed to get FCM access token: ${JSON.stringify(err)}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Send a single FCM v1 notification.
 * Returns true if the token is still valid, false if it should be deactivated.
 */
async function sendFCMv1(
  accessToken: string,
  projectId: string,
  deviceToken: string,
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
        token: deviceToken,
        notification: { title, body },
        data: { url: '/' },
      },
    }),
  })

  if (response.ok) return true

  const error = await response.json()
  const errorCode = error?.error?.details?.[0]?.errorCode ?? error?.error?.status ?? ''
  // UNREGISTERED or INVALID_ARGUMENT means the token is dead
  return errorCode !== 'UNREGISTERED' && errorCode !== 'INVALID_ARGUMENT'
}

// ─── APNs ──────────────────────────────────────────────

/**
 * Get a short-lived APNs provider JWT from an Auth Key (.p8).
 */
async function getAPNsToken(
  keyId: string,
  teamId: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  const header = btoa(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const claims = btoa(JSON.stringify({ iss: teamId, iat: now }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const encoder = new TextEncoder()
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const signingInput = encoder.encode(`${header}.${claims}`)
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signingInput,
  )

  // Convert DER signature to raw r||s format for JWT
  const rawSignature = derToRaw(new Uint8Array(signatureBuffer))
  const sig = btoa(String.fromCharCode(...rawSignature))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${header}.${claims}.${sig}`
}

/**
 * Convert a DER-encoded ECDSA signature to raw r||s format (64 bytes).
 */
function derToRaw(der: Uint8Array): Uint8Array {
  const SIGNATURE_LENGTH = 32

  // DER: 0x30 [total-len] 0x02 [r-len] [r] 0x02 [s-len] [s]
  let offset = 2 // skip 0x30 + total length
  const rLen = der[offset + 1]
  const rStart = offset + 2
  const sLenOffset = rStart + rLen
  const sLen = der[sLenOffset + 1]
  const sStart = sLenOffset + 2

  const r = der.slice(rStart, rStart + rLen)
  const s = der.slice(sStart, sStart + sLen)

  const raw = new Uint8Array(SIGNATURE_LENGTH * 2)
  // Right-align r and s into 32-byte slots (handles leading zeros)
  raw.set(r.length > SIGNATURE_LENGTH ? r.slice(r.length - SIGNATURE_LENGTH) : r, SIGNATURE_LENGTH - Math.min(r.length, SIGNATURE_LENGTH))
  raw.set(s.length > SIGNATURE_LENGTH ? s.slice(s.length - SIGNATURE_LENGTH) : s, SIGNATURE_LENGTH * 2 - Math.min(s.length, SIGNATURE_LENGTH))

  return raw
}

/**
 * Send a single APNs notification.
 * Returns true if the token is still valid, false if it should be deactivated.
 */
async function sendAPNs(
  jwt: string,
  bundleId: string,
  deviceToken: string,
  title: string,
  body: string,
): Promise<boolean> {
  const url = `https://api.push.apple.com/3/device/${deviceToken}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '5',
    },
    body: JSON.stringify({
      aps: {
        alert: { title, body },
        sound: 'default',
        badge: 1,
      },
    }),
  })

  if (response.ok) return true

  // 410 Gone = token is no longer valid
  // 400 BadDeviceToken = token is invalid
  return response.status !== 410 && response.status !== 400
}

// ─── Shared crypto ─────────────────────────────────────

/**
 * Sign a payload with RS256 (RSA + SHA-256) and return the full JWT.
 */
async function signRS256(headerDotClaims: string, privateKeyPem: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = privateKeyPem
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

  const signingInput = encoder.encode(headerDotClaims)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signingInput)
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${headerDotClaims}.${sig}`
}

// ─── Main handler ──────────────────────────────────────

Deno.serve(async (req) => {
  // Verify the request is from Supabase cron with the correct secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cronToken = authHeader.slice('Bearer '.length)
  if (CRON_SECRET === '' || cronToken !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  const hasFCM = FCM_PROJECT_ID !== '' && FCM_SERVICE_ACCOUNT_JSON !== ''
  const hasAPNs = APNS_KEY_ID !== '' && APNS_TEAM_ID !== '' && APNS_PRIVATE_KEY !== '' && APNS_BUNDLE_ID !== ''

  if (!hasFCM && !hasAPNs) {
    return new Response(JSON.stringify({ error: 'No push credentials configured' }), {
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
    .select('id, user_id, token, platform, locale')
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

  const studiedTodaySet = new Set<string>()
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

  // Split targets by platform
  const webTargets = targets.filter((t) => t.platform === 'web')
  const iosTargets = targets.filter((t) => t.platform === 'ios')

  let sentCount = 0
  const failedTokenIds: string[] = []

  // Send FCM notifications (web)
  if (hasFCM && webTargets.length > 0) {
    const fcmAccessToken = await getFCMAccessToken(FCM_SERVICE_ACCOUNT_JSON)

    for (const target of webTargets) {
      const msg = MESSAGES[target.locale] ?? MESSAGES.en
      try {
        const success = await sendFCMv1(fcmAccessToken, FCM_PROJECT_ID, target.token, msg.title, msg.body)
        if (success) {
          sentCount++
        } else {
          failedTokenIds.push(target.id)
        }
      } catch {
        // Network error — don't deactivate, might be transient
      }
    }
  }

  // Send APNs notifications (iOS)
  if (hasAPNs && iosTargets.length > 0) {
    const apnsJwt = await getAPNsToken(APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY)

    for (const target of iosTargets) {
      const msg = MESSAGES[target.locale] ?? MESSAGES.en
      try {
        const success = await sendAPNs(apnsJwt, APNS_BUNDLE_ID, target.token, msg.title, msg.body)
        if (success) {
          sentCount++
        } else {
          failedTokenIds.push(target.id)
        }
      } catch {
        // Network error — don't deactivate, might be transient
      }
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
      breakdown: {
        web: webTargets.length,
        ios: iosTargets.length,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
