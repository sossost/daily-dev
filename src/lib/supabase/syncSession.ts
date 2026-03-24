import { createClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/currentUser";
import {
  streakDataSchema,
  sessionDataSchema,
  srsUpdateSchema,
  topicUpdateSchema,
  sessionAnswerSchema,
} from "@/lib/supabase/syncSchemas";
import type {
  SRSRecord,
  TopicStat,
  SessionRecord,
  SessionAnswer,
  Topic,
} from "@/types";
import { TOPICS } from "@/types";

export async function syncAfterSession(
  sessionRecord: SessionRecord,
  answers: SessionAnswer[],
  srsRecords: Record<string, SRSRecord>,
  topicStats: Record<Topic, TopicStat>,
  streakData: {
    correct: number;
    answered: number;
    current_streak: number;
    date: string;
  },
): Promise<void> {
  const userId = getCurrentUserId();
  if (userId == null) return;

  const supabase = createClient();

  const touchedQuestionIds = new Set(answers.map((a) => a.questionId));
  const srsUpdates = Object.values(srsRecords)
    .filter((r) => touchedQuestionIds.has(r.questionId))
    .map((r) => ({
      user_id: userId,
      question_id: r.questionId,
      ease: r.ease,
      interval: r.interval,
      repetitions: r.repetitions,
      next_review: r.nextReview,
      last_review: r.lastReview,
    }));

  const touchedTopics = new Set(answers.map((a) => a.topic));
  const topicUpdates = TOPICS.filter((t) => touchedTopics.has(t)).map((t) => ({
    user_id: userId,
    topic: t,
    total_answered: topicStats[t].totalAnswered,
    correct_answers: topicStats[t].correctAnswers,
    accuracy: topicStats[t].accuracy,
    average_time: topicStats[t].averageTime,
  }));

  const sessionData = {
    id: sessionRecord.id,
    user_id: userId,
    date: sessionRecord.date,
    score: sessionRecord.score,
    total_questions: sessionRecord.totalQuestions,
    duration: sessionRecord.duration,
    created_at: new Date().toISOString(),
  };

  const sessionAnswers = answers.map((a) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    session_id: sessionRecord.id,
    question_id: a.questionId,
    topic: a.topic,
    selected_index: a.selectedIndex,
    is_correct: a.isCorrect,
    time_spent: a.timeSpent,
  }));

  // Validate payloads — catches key name mismatches before RPC call
  streakDataSchema.parse(streakData);
  sessionDataSchema.parse(sessionData);
  srsUpdates.forEach((r) => srsUpdateSchema.parse(r));
  topicUpdates.forEach((r) => topicUpdateSchema.parse(r));
  sessionAnswers.forEach((r) => sessionAnswerSchema.parse(r));

  const { error } = await supabase.rpc("sync_after_session", {
    p_user_id: userId,
    p_session: sessionData,
    p_answers: sessionAnswers,
    p_srs_updates: srsUpdates,
    p_topic_updates: topicUpdates,
    p_streak_data: streakData,
  });

  if (error != null) {
    throw new Error(`Session sync failed: ${error.message}`);
  }
}
