import { SITE_URL } from "@/lib/constants";

export type ShareResult = "shared" | "cancelled" | "copied" | "failed";

export function buildShareText(correct: number, total: number): string {
  if (correct < 0 || total <= 0 || correct > total || !Number.isFinite(correct) || !Number.isFinite(total)) {
    return `DailyDev에서 퀴즈를 풀었어요! 🎯\n${SITE_URL}`;
  }
  return `DailyDev에서 ${total}문제 중 ${correct}개 맞췄어요! 🎯\n${SITE_URL}`;
}

export async function shareResult(
  correct: number,
  total: number,
): Promise<ShareResult> {
  const text = buildShareText(correct, total);

  if (typeof navigator !== "undefined" && navigator.share != null) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return "cancelled";
      }
      // Other errors (NotAllowedError, etc.) fall through to clipboard
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard != null) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      // clipboard failed, fall through
    }
  }

  return "failed";
}
