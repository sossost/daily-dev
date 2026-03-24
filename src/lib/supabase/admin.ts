import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only admin Supabase client (singleton, shared across requests).
 * Uses service role key to bypass RLS — NEVER expose to the browser.
 * The client is stateless (no per-request headers or session), so sharing is safe.
 * Lazy-initialized to avoid build-time errors when env vars are missing.
 */
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client != null) {
    return client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url == null || url === "" || key == null || key === "") {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}
