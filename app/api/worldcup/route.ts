import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { analyzePicks, resolvePicks } from "@/lib/worldcup/analysis";
import { fallbackVerdict } from "@/lib/worldcup/data";

const requestSchema = z.object({
  picks: z.array(z.string().trim().min(1).max(40)).min(1).max(15),
  locale: z.enum(["ko", "en"]).default("ko"),
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
      { error: locale === "en" ? "Check the pick list." : "선택 목록을 확인해 주세요." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9_000);

  try {
    const result = await analyzePicks(payload.picks, payload.locale, controller.signal);
    return NextResponse.json(result);
  } catch (error) {
    console.error("worldcup request failed", error);
    const picks = resolvePicks(payload.picks);
    return NextResponse.json({ verdict: fallbackVerdict(picks, payload.locale), source: "portfolio" });
  } finally {
    clearTimeout(timeout);
  }
}
