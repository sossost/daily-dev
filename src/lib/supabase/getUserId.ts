import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type UserIdentity = {
  id: string;
  type: "auth" | "anonymous";
};

/**
 * Server-side: extract user identity from auth session or anonymous cookie.
 * Returns auth.uid for authenticated users, anon_id cookie for anonymous users.
 */
export async function getUserId(): Promise<UserIdentity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user != null) {
    return { id: user.id, type: "auth" };
  }

  const cookieStore = await cookies();
  const anonId = cookieStore.get("anon_id")?.value;

  if (anonId != null && anonId !== "") {
    return { id: anonId, type: "anonymous" };
  }

  return null;
}
