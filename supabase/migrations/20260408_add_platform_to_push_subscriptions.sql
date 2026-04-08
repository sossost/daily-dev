-- Extend push_subscriptions to support multiple platforms (web FCM + iOS APNs)

-- 1. Rename fcm_token → token (generic name for both FCM and APNs tokens)
ALTER TABLE push_subscriptions RENAME COLUMN fcm_token TO token;

-- 2. Add platform column to distinguish web (FCM) from iOS (APNs)
ALTER TABLE push_subscriptions
  ADD COLUMN platform TEXT NOT NULL DEFAULT 'web'
  CONSTRAINT push_subscriptions_platform_check CHECK (platform IN ('web', 'ios'));

-- 3. Update unique constraint (token is unique per platform)
ALTER TABLE push_subscriptions DROP CONSTRAINT push_subscriptions_fcm_token_key;
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_token_platform_key UNIQUE (token, platform);
