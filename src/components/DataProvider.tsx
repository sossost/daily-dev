"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProgressStore } from "@/stores/useProgressStore";
import { useBookmarkStore } from "@/stores/useBookmarkStore";
import { setCurrentUser } from "@/lib/supabase/currentUser";
import { migrateAnonymousData } from "@/lib/supabase/migrate";
import type { ServerUserData } from "@/lib/supabase/loadUserData";

const LOCAL_STORAGE_PROGRESS_KEY = "daily-dev-progress";

interface DataProviderProps {
  userId: string | null;
  isAuthenticated: boolean;
  initialData: ServerUserData | null;
  children: React.ReactNode;
}

/**
 * Injects server-fetched user data into Zustand stores.
 * Defers child rendering until client-side injection is complete,
 * preventing flash of default values during hydration.
 */
export function DataProvider({
  userId,
  isAuthenticated,
  initialData,
  children,
}: DataProviderProps) {
  const injected = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Synchronous injection during render — stores are ready before children render
  if (!injected.current) {
    injected.current = true;
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // One-time migration: localStorage → Supabase for existing anonymous users
  useEffect(() => {
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

  if (!isMounted) {
    return <DataProviderSkeleton />;
  }

  return <>{children}</>;
}

function DataProviderSkeleton() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
          </div>
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6" />
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="flex-1 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
