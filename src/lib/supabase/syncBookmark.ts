import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/currentUser";

const DEBOUNCE_MS = 300;
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function syncBookmark(
  questionId: string,
  isBookmarked: boolean,
): Promise<void> {
  const existing = debounceTimers.get(questionId);
  if (existing != null) {
    clearTimeout(existing);
  }

  return new Promise((resolve) => {
    debounceTimers.set(
      questionId,
      setTimeout(async () => {
        debounceTimers.delete(questionId);

        const userId = getCurrentUserId();
        if (userId == null) {
          resolve();
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.rpc("upsert_bookmark", {
          p_user_id: userId,
          p_question_id: questionId,
          p_action: isBookmarked ? "add" : "remove",
        });

        if (error != null) {
          // Sync failed silently — bookmark state is in Zustand
        }

        resolve();
      }, DEBOUNCE_MS),
    );
  });
}
