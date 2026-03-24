import { z } from "zod";

/**
 * Zod schemas for Supabase RPC payloads.
 * Keys MUST match the snake_case keys that SQL reads via ->> operator.
 * If a key mismatch exists, validation fails BEFORE the RPC call.
 */

export const streakDataSchema = z.object({
  correct: z.number().int(),
  answered: z.number().int(),
  current_streak: z.number().int(),
  date: z.string(),
});

export const sessionDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  date: z.string(),
  score: z.number().int(),
  total_questions: z.number().int(),
  duration: z.number(),
  created_at: z.string(),
});

export const srsUpdateSchema = z.object({
  user_id: z.string(),
  question_id: z.string(),
  ease: z.number(),
  interval: z.number(),
  repetitions: z.number().int(),
  next_review: z.string(),
  last_review: z.string(),
});

export const topicUpdateSchema = z.object({
  user_id: z.string(),
  topic: z.string(),
  total_answered: z.number().int(),
  correct_answers: z.number().int(),
  accuracy: z.number(),
  average_time: z.number(),
});

export const sessionAnswerSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  question_id: z.string(),
  topic: z.string(),
  selected_index: z.number().int(),
  is_correct: z.boolean(),
  time_spent: z.number(),
});

export type StreakData = z.infer<typeof streakDataSchema>;
export type SessionData = z.infer<typeof sessionDataSchema>;
export type SrsUpdate = z.infer<typeof srsUpdateSchema>;
export type TopicUpdate = z.infer<typeof topicUpdateSchema>;
export type SessionAnswerData = z.infer<typeof sessionAnswerSchema>;
