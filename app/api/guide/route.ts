import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { runGuide } from "@/lib/guide/graph";
import { guideFallbackPayload } from "@/lib/guide/fallback";
import { GUIDE_LIMITS, guideMemorySchema } from "@/lib/guide/safety";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(GUIDE_LIMITS.historyInput),
});

const requestSchema = z.object({
  question: z.string().trim().min(1).max(GUIDE_LIMITS.question),
  history: z.array(messageSchema).max(GUIDE_LIMITS.historyMessages).default([]),
  locale: z.enum(["ko", "en"]).default("ko"),
  memory: guideMemorySchema.optional(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;
  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
    payload = requestSchema.parse(rawPayload);
  } catch {
    const locale = rawPayload && typeof rawPayload === "object" && "locale" in rawPayload && rawPayload.locale === "en" ? "en" : "ko";
    return NextResponse.json(
      { error: locale === "en" ? "Check the question and recent conversation length." : "질문과 최근 대화 길이를 확인해 주세요." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const result = await runGuide(payload.question, controller.signal, payload.locale, payload.history, payload.memory);
    return NextResponse.json(result);
  } catch (error) {
    console.error("guide request failed", error);
    return NextResponse.json(guideFallbackPayload(payload.question, payload.locale, payload.history, payload.memory));
  } finally {
    clearTimeout(timeout);
  }
}
