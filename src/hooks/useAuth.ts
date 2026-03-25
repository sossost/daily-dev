import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setCurrentUser } from "@/lib/supabase/currentUser";
import { migrateFromLocalStorage } from "@/lib/supabase/migrate";
import { useProgressStore } from "@/stores/useProgressStore";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { deactivateAllPushTokens } from "@/lib/supabase/push";
import { FCM_TOKEN_KEY } from "@/hooks/usePushNotification";
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

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
    signOut,
  };
}
