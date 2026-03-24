import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  UserProgress,
  SRSRecord,
  SessionRecord,
  SessionAnswer,
  Topic,
} from "@/types";
import { DEFAULT_USER_PROGRESS } from "@/types";

export interface ServerUserData {
  progress: UserProgress;
  bookmarks: string[];
}

/**
 * Server-side: load user data from Supabase using admin client (RLS bypass).
 * Works for both authenticated and anonymous users.
 * Called in layout.tsx (server component) — no client-side fetch needed.
 */
export async function loadServerUserData(
  userId: string,
): Promise<ServerUserData | null> {
  const admin = getSupabaseAdmin();

  const [statsRes, topicRes, srsRes, sessionsRes, answersRes, bookmarksRes] =
    await Promise.all([
      admin
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      admin.from("topic_stats").select("*").eq("user_id", userId),
      admin.from("srs_records").select("*").eq("user_id", userId),
      admin
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false }),
      admin
        .from("session_answers")
        .select("*")
        .eq("user_id", userId),
      admin
        .from("bookmarks")
        .select("question_id")
        .eq("user_id", userId),
    ]);

  // Return null if any query failed — fall back to empty state
  const hasError =
    statsRes.error != null ||
    topicRes.error != null ||
    srsRes.error != null ||
    sessionsRes.error != null ||
    answersRes.error != null ||
    bookmarksRes.error != null;

  if (hasError || statsRes.data == null) return null;

  const topicStats = { ...DEFAULT_USER_PROGRESS.topicStats };
  for (const row of topicRes.data ?? []) {
    const topic = row.topic as Topic;
    if (topicStats[topic] != null) {
      topicStats[topic] = {
        topic,
        totalAnswered: row.total_answered,
        correctAnswers: row.correct_answers,
        accuracy: row.accuracy,
        averageTime: row.average_time,
      };
    }
  }

  const srsRecords: Record<string, SRSRecord> = {};
  for (const row of srsRes.data ?? []) {
    srsRecords[row.question_id] = {
      questionId: row.question_id,
      ease: row.ease,
      interval: row.interval,
      repetitions: row.repetitions,
      nextReview: row.next_review,
      lastReview: row.last_review,
    };
  }

  const answersMap = new Map<string, SessionAnswer[]>();
  for (const row of answersRes.data ?? []) {
    const list = answersMap.get(row.session_id) ?? [];
    list.push({
      questionId: row.question_id,
      topic: row.topic as Topic,
      selectedIndex: row.selected_index,
      isCorrect: row.is_correct,
      timeSpent: row.time_spent,
    });
    answersMap.set(row.session_id, list);
  }

  const sessions: SessionRecord[] = (sessionsRes.data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    answers: answersMap.get(row.id) ?? [],
    score: row.score,
    totalQuestions: row.total_questions,
    duration: row.duration,
  }));

  const stats = statsRes.data;
  const progress: UserProgress = {
    totalSessions: stats.total_sessions,
    totalCorrect: stats.total_correct,
    totalAnswered: stats.total_answered,
    currentStreak: stats.current_streak,
    longestStreak: stats.longest_streak,
    lastSessionDate: stats.last_session_date,
    topicStats,
    srsRecords,
    sessions,
  };

  const bookmarks = (bookmarksRes.data ?? []).map(
    (r: { question_id: string }) => r.question_id,
  );

  return { progress, bookmarks };
}
