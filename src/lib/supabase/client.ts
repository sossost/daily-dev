import { createBrowserClient } from "@supabase/ssr";

let instance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (instance == null) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url == null || url === "" || key == null || key === "") {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }

    instance = createBrowserClient(url, key);
  }
  return instance;
}
