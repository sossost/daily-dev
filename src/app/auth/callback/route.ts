import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code == null) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error != null) {
    const isNative = searchParams.get("native") === "true";
    if (isNative) {
      return NextResponse.redirect("dailydevapp://auth/error");
    }
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const isNative = searchParams.get("native") === "true";

  // For native app: pass session tokens via deep link
  if (isNative) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session != null) {
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      return NextResponse.redirect(`dailydevapp://auth/complete?${params}`);
    }
    return NextResponse.redirect("dailydevapp://auth/error");
  }

  // Transfer anonymous data to the authenticated account
  const cookieStore = await cookies();
  const anonId = cookieStore.get("anon_id")?.value;
  let transferSucceeded = false;

  if (anonId != null && UUID_V4_REGEX.test(anonId)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user != null) {
      try {
        const admin = getSupabaseAdmin();
        const { error: rpcError } = await admin.rpc(
          "transfer_anonymous_data",
          {
            p_anon_id: anonId,
            p_auth_id: user.id,
          },
        );
        transferSucceeded = rpcError == null;
      } catch {
        // Transfer failed — anonymous data remains under anon_id
      }
    }
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  // Only delete anonymous cookie if transfer succeeded
  if (transferSucceeded) {
    response.cookies.delete("anon_id");
  }

  return response;
}
