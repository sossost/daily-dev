import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser } from "@/lib/supabase/currentUser";
import { migrateFromLocalStorage } from "@/lib/supabase/migrate";
import { useProgressStore } from "@/stores/useProgressStore";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { deactivateAllPushTokens } from "@/lib/supabase/push";
import { FCM_TOKEN_KEY } from "@/hooks/usePushNotification";
import { isNativeApp, postNativeMessage } from "@/lib/native-bridge";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// Module-level — prevents duplicate migration across navigations
let hasMigrated = false;

function handleSignIn(user: User): void {
  if (hasMigrated) return;
  hasMigrated = true;
  setCurrentUser(user.id, true);
  migrateFromLocalStorage().catch(() => {});
}

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: User | null } }) => {
        if (cancelled) return;
        setState({ user: data.user, isLoading: false });

        if (data.user != null) {
          handleSignIn(data.user);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ user: null, isLoading: false });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (cancelled) return;
        const user = session?.user ?? null;
        setState({ user, isLoading: false });

        const isSignIn =
          event === "SIGNED_IN" || event === "INITIAL_SESSION";
        if (isSignIn && user != null) {
          handleSignIn(user);
        }

        if (event === "SIGNED_OUT") {
          hasMigrated = false;
        }
      },
    );

    // Listen for native Apple Sign In token injection
    const handleAppleToken = () => {
      const idToken = window.__DAILYDEV_APPLE_ID_TOKEN__;
      if (idToken == null) return;
      window.__DAILYDEV_APPLE_ID_TOKEN__ = undefined;

      supabase.auth.signInWithIdToken({
        provider: "apple",
        token: idToken,
      });
    };

    window.addEventListener("appleIdTokenReceived", handleAppleToken);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("appleIdTokenReceived", handleAppleToken);
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInWithGitHub = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInWithApple = useCallback(async () => {
    if (isNativeApp()) {
      // Native iOS: delegate to the RN shell for ASAuthorizationAppleIDProvider
      postNativeMessage({ type: 'appleSignIn' });
      return;
    }
    // Web: standard OAuth redirect
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await deactivateAllPushTokens();
    } catch {
      // Best-effort cleanup — proceed with sign-out regardless
    }
    localStorage.removeItem(FCM_TOKEN_KEY);
    await supabase.auth.signOut();
    useProgressStore.getState().reset();
    useBookmarkStore.getState().reset();
    setCurrentUser(null, false);
    router.refresh();
  }, [router]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    signInWithGoogle,
    signInWithGitHub,
    signInWithApple,
    signOut,
  };
}
