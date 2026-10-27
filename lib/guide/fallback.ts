import "server-only";

import { fallbackGuideAnswer, guideSuggestions, resolveGuideIntent } from "@/lib/guide/logic";
import { advanceGuideMemory, detectExplicitTargetRole, resolveTargetRole } from "@/lib/guide/memory";
import { guideCards } from "@/lib/guide/presentation";
import {
  guardedGuideAnswer,
  inspectGuideInput,
  normalizeGuideHistory,
  normalizeGuideMemory,
  type GuideConversationMemory,
  type GuideHistoryMessage,
} from "@/lib/guide/safety";
import type { GuideLocale } from "@/lib/guide/logic";

// Deterministic response path used when the graph or model is unavailable.
// Mirrors the graph pipeline: intent routing -> role resolution -> verified answer.
export function guideFallbackPayload(
  question: string,
  locale: GuideLocale,
  history?: GuideHistoryMessage[],
  memory?: GuideConversationMemory,
) {
  const safeMemory = normalizeGuideMemory(memory);
  const guard = inspectGuideInput(question);
  if (!guard.allowed) {
    return {
      answer: guardedGuideAnswer(guard.reason, locale),
      suggestions: guideSuggestions("out_of_scope", locale),
      source: "portfolio" as const,
      cards: guideCards("out_of_scope", locale),
      memory: safeMemory,
    };
  }

  const safeHistory = normalizeGuideHistory(history);
  const detectedIntent = resolveGuideIntent(question, locale, safeHistory);
  const intent = detectedIntent === "out_of_scope" && safeMemory.roleAsked && detectExplicitTargetRole(question, true) ? "hiring" : detectedIntent;
  const targetRole = resolveTargetRole(question, safeHistory, safeMemory);
  const resolvedMemory = { ...safeMemory, targetRole };
  const answer = fallbackGuideAnswer(intent, locale, question, resolvedMemory);
  return {
    answer,
    suggestions: guideSuggestions(intent, locale, targetRole),
    source: "portfolio" as const,
    cards: guideCards(intent, locale, targetRole, resolvedMemory.coveredEvidence, question, safeHistory),
    memory: advanceGuideMemory(resolvedMemory, intent, targetRole, answer),
  };
}
