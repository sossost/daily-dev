"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgressStore } from "@/stores/useProgressStore";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { setCurrentUser } from "@/lib/supabase/currentUser";
import { migrateAnonymousData } from "@/lib/supabase/migrate";
import type { ServerUserData } from "@/lib/supabase/loadUserData";

const LOCAL_STORAGE_PROGRESS_KEY = "daily-dev-progress";

// Module-level guard — persists across remounts (locale change, etc.)
let injectedForUserId: string | null | undefined = undefined;

interface DataProviderProps {
  userId: string | null;
  isAuthenticated: boolean;
  initialData: ServerUserData | null;
  children: React.ReactNode;
}

/**
 * Injects server-fetched user data into Zustand stores.
 * Uses useLayoutEffect to update stores before paint,
 * preventing both flash and "setState during render" warnings.
 */
export function DataProvider({
  userId,
  isAuthenticated,
  initialData,
  children,
}: DataProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // Runs before browser paint — no visual flash, no render-time setState
  useLayoutEffect(() => {
    if (injectedForUserId !== userId) {
      injectedForUserId = userId;
      setCurrentUser(userId, isAuthenticated);

      if (initialData != null) {
        useProgressStore.setState({
          ...initialData.progress,
          updateAfterSession: useProgressStore.getState().updateAfterSession,
        });
        useBookmarkStore.setState({
          bookmarkedIds: initialData.bookmarks,
        });
      }
    }

    setIsReady(true);
  }, [userId, isAuthenticated, initialData]);

  // One-time migration: localStorage → Supabase for existing anonymous users
  useLayoutEffect(() => {
    if (initialData != null || userId == null || isAuthenticated) return;

    try {
      const hasLocalData =
        localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY) != null;
      if (!hasLocalData) return;
    } catch {
      return;
    }

    migrateAnonymousData(userId)
      .then((migrated) => {
        if (migrated) {
          router.refresh();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  if (!isReady) {
    return <DataProviderSkeleton />;
  }

  return <>{children}</>;
}

function DataProviderSkeleton() {
  return <main className="max-w-lg mx-auto px-4 py-8" />;
}
