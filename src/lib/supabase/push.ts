import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/currentUser'

/**
 * Save an FCM push token to Supabase.
 * Creates a new record or reactivates an existing one.
 */
export async function savePushToken(fcmToken: string, locale: string = 'en'): Promise<boolean> {
  const userId = getCurrentUserId()
  if (userId == null) return false

  const supabase = createClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        fcm_token: fcmToken,
        is_active: true,
        locale,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'fcm_token' },
    )

  return error == null
}

/**
 * Deactivate a push token (soft delete).
 */
export async function deactivatePushToken(fcmToken: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (userId == null) return false

  const supabase = createClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('fcm_token', fcmToken)
    .eq('user_id', userId)

  return error == null
}

/**
 * Deactivate all push tokens for the current user (e.g. on logout).
 */
export async function deactivateAllPushTokens(): Promise<void> {
  const userId = getCurrentUserId()
  if (userId == null) return

  const supabase = createClient()
  await supabase
    .from('push_subscriptions')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

/**
 * Check if the current user has an active push subscription.
 */
export async function getPushStatus(): Promise<boolean> {
  const userId = getCurrentUserId()
  if (userId == null) return false

  const supabase = createClient()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)

  return data != null && data.length > 0
}
