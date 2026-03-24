"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIsAuthenticated } from "@/lib/supabase/currentUser";
import { LoginModal } from "@/components/LoginModal";

export function AuthButton() {
  const { user, isLoading, signInWithGoogle, signInWithGitHub, signOut } =
    useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // DataProvider sets currentUser during render (before this component).
  // Determines layout BEFORE useAuth resolves → zero CLS.
  const isAuthenticated = getIsAuthenticated();

  if (isAuthenticated) {
    const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
    const name =
      (user?.user_metadata?.full_name as string | undefined) ?? "User";

    return (
      <div aria-live="polite" className="flex items-center gap-2">
        {avatarUrl != null ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-8 h-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {isLoading ? "" : name.charAt(0).toUpperCase()}
          </div>
        )}
        <button
          onClick={signOut}
          disabled={isLoading}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
          aria-label="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // Not authenticated — show login button immediately (no loading state)
  return (
    <div aria-live="polite">
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="로그인"
      >
        <LogIn size={14} />
        로그인
      </button>
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoogle={signInWithGoogle}
        onGitHub={signInWithGitHub}
      />
    </div>
  );
}
