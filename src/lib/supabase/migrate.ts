import { createClient } from "@/lib/supabase/client";
import type { UserProgress } from "@/types";
import { TOPICS } from "@/types";

export async function migrateFromLocalStorage(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user == null) return false;

  const userId = user.id;

  const { data: existing } = await supabase
    .from("user_stats")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing != null) {
    // Server wins — clear stale localStorage to prevent zombie data
    clearLocalStorage();
    return false;
  }

  const { progress, bookmarkIds } = readLocalStorageData();
  if (progress == null) return false;

  const { error } = await supabase.rpc("migrate_user_data", {
    p_user_id: userId,
    p_user_stats: buildUserStats(userId, progress),
    p_topic_stats: buildTopicStats(userId, progress),
    p_srs_records: buildSrsRecords(userId, progress),
    p_sessions: buildSessions(userId, progress),
    p_session_answers: buildSessionAnswers(userId, progress),
    p_bookmarks: buildBookmarks(userId, bookmarkIds),
  });

  if (error != null) {
    throw new Error(`Migration failed: ${error.message}`);
  }

  clearLocalStorage();
  return true;
}

/**
 * Migrate localStorage data for anonymous users (no auth session).
 * Called from DataProvider when server has no data but localStorage has data.
 */
export async function migrateAnonymousData(
  userId: string,
): Promise<boolean> {
  const { progress, bookmarkIds } = readLocalStorageData();
  if (progress == null) return false;

  // RPC is SECURITY DEFINER — bypasses RLS, works for anonymous users
  const supabase = createClient();
  const { error } = await supabase.rpc("migrate_user_data", {
    p_user_id: userId,
    p_user_stats: buildUserStats(userId, progress),
    p_topic_stats: buildTopicStats(userId, progress),
    p_srs_records: buildSrsRecords(userId, progress),
    p_sessions: buildSessions(userId, progress),
    p_session_answers: buildSessionAnswers(userId, progress),
    p_bookmarks: buildBookmarks(userId, bookmarkIds),
  });

  if (error != null) {
    return false;
  }

  clearLocalStorage();
  return true;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function readLocalStorageData(): {
  progress: UserProgress | null;
  bookmarkIds: string[];
} {
  let progress: UserProgress | null = null;
  let bookmarkIds: string[] = [];

  try {
    const raw = localStorage.getItem("daily-dev-progress");
    if (raw != null) {
      const parsed = JSON.parse(raw);
      const state = parsed.state;
      if (
        typeof state === "object" &&
        state != null &&
        typeof state.totalSessions === "number"
      ) {
        progress = state as UserProgress;
      }
    }
  } catch {
    return { progress: null, bookmarkIds: [] };
  }

  try {
    const raw = localStorage.getItem("daily-dev-bookmarks");
    if (raw != null) {
      const parsed = JSON.parse(raw);
      bookmarkIds = parsed.state?.bookmarkedIds ?? [];
    }
  } catch {
    // ignore
  }

  return { progress, bookmarkIds };
}

function buildUserStats(userId: string, progress: UserProgress) {
  return {
    user_id: userId,
    total_sessions: progress.totalSessions ?? 0,
    total_correct: progress.totalCorrect ?? 0,
    total_answered: progress.totalAnswered ?? 0,
    current_streak: progress.currentStreak ?? 0,
    longest_streak: progress.longestStreak ?? 0,
    last_session_date: progress.lastSessionDate ?? null,
    updated_at: new Date().toISOString(),
  };
}

function buildTopicStats(userId: string, progress: UserProgress) {
  return TOPICS.filter((t) => progress.topicStats[t]?.totalAnswered > 0).map(
    (t) => ({
      user_id: userId,
      topic: t,
      total_answered: progress.topicStats[t].totalAnswered,
      correct_answers: progress.topicStats[t].correctAnswers,
      accuracy: progress.topicStats[t].accuracy,
      average_time: progress.topicStats[t].averageTime,
    }),
  );
}

function buildSrsRecords(userId: string, progress: UserProgress) {
  return Object.values(progress.srsRecords ?? {}).map((r) => ({
    user_id: userId,
    question_id: r.questionId,
    ease: r.ease,
    interval: r.interval,
    repetitions: r.repetitions,
    next_review: r.nextReview,
    last_review: r.lastReview,
  }));
}

function buildSessions(userId: string, progress: UserProgress) {
  return (progress.sessions ?? []).map((s) => ({
    id: s.id,
    user_id: userId,
    date: s.date,
    score: s.score,
    total_questions: s.totalQuestions,
    duration: s.duration,
    created_at: new Date().toISOString(),
  }));
}

function buildSessionAnswers(userId: string, progress: UserProgress) {
  return (progress.sessions ?? []).flatMap((s) =>
    (s.answers ?? []).map((a) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: s.id,
      question_id: a.questionId,
      topic: a.topic,
      selected_index: a.selectedIndex,
      is_correct: a.isCorrect,
      time_spent: a.timeSpent,
    })),
  );
}

function buildBookmarks(userId: string, bookmarkIds: string[]) {
  return bookmarkIds.map((qid) => ({
    user_id: userId,
    question_id: qid,
    created_at: new Date().toISOString(),
  }));
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem("daily-dev-progress");
    localStorage.removeItem("daily-dev-bookmarks");
  } catch {
    // ignore
  }
}
