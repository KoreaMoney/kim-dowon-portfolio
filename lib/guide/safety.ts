import type { GuideIntent, GuideLocale } from "./logic";
import { z } from "zod/v4";

export type GuideHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export const guideTargetRoles = ["frontend", "agent", "hybrid", "unknown"] as const;
export type GuideTargetRole = (typeof guideTargetRoles)[number];

export const guideEvidenceIds = [
  "layouteditor",
  "digital-twin",
  "translation-agent",
  "booking-agent",
  "browser-admin",
  "openstock",
  "opendata",
  "openalarm",
  "career",
  "collaboration",
] as const;
export type GuideEvidenceId = (typeof guideEvidenceIds)[number];

const guideIntents = ["career", "frontend", "agent", "openstock", "opendata", "openalarm", "projects", "hiring", "contact", "general", "out_of_scope"] as const;

export const guideMemorySchema = z
  .object({
    targetRole: z.enum(guideTargetRoles).default("unknown"),
    lastIntent: z.enum(guideIntents).optional(),
    coveredEvidence: z.array(z.enum(guideEvidenceIds)).max(8).default([]),
    roleAsked: z.boolean().default(false),
  })
  .strict();

export type GuideConversationMemory = z.infer<typeof guideMemorySchema>;

export const EMPTY_GUIDE_MEMORY: GuideConversationMemory = {
  targetRole: "unknown",
  coveredEvidence: [],
  roleAsked: false,
};

export type GuideGuardReason = "instruction_override" | "sensitive_request" | "invalid_input";

export const GUIDE_LIMITS = {
  question: 500,
  historyMessages: 12,
  historyInput: 1_200,
  historyPrompt: 500,
  answer: 700,
} as const;

export function normalizeGuideMemory(memory?: unknown): GuideConversationMemory {
  const parsed = guideMemorySchema.safeParse(memory);
  if (!parsed.success) return { ...EMPTY_GUIDE_MEMORY };
  return {
    ...parsed.data,
    coveredEvidence: [...new Set(parsed.data.coveredEvidence)].slice(-8),
  };
}

const instructionOverridePatterns = [
  /(?:ignore|disregard|override|forget|bypass).{0,40}(?:previous|prior|system|developer|hidden|safety).{0,30}(?:instruction|prompt|rule|policy)/i,
  /(?:previous|prior|system|developer|hidden|safety).{0,30}(?:instruction|prompt|rule|policy).{0,40}(?:ignore|disregard|override|forget|bypass)/i,
  /(?:이전|위의|시스템|개발자|숨겨진|안전).{0,30}(?:지시|지침|프롬프트|규칙|정책).{0,40}(?:무시|잊|우회|덮어|바꿔)/,
  /(?:무시|잊|우회|덮어|바꿔).{0,40}(?:이전|위의|시스템|개발자|숨겨진|안전).{0,30}(?:지시|지침|프롬프트|규칙|정책)/,
  /\b(?:jailbreak|developer mode|dan mode)\b/i,
  /\b(?:ignore|disregard|override|forget|bypass)\s+(?:all|your|the)\s+(?:instructions|rules|policies)\b/i,
  /(?:이|모든|이전|위의)\s*(?:지시|지침|규칙|정책)(?:을|를)?\s*(?:다\s*)?(?:무시|잊|우회|덮어|바꿔)/,
];

const protectedTarget = "(?:api[_ -]?key|openai[_ -]?key|access[_ -]?token|password|secret(?:s)?|environment variables?|env(?:ironment)?|system prompt|developer message|hidden instructions?)";
const protectedTargetKo = "(?:api[ _-]?키|액세스[ _-]?토큰|비밀번호|비밀(?: 정보)?|환경 변수|시스템 프롬프트|개발자 메시지|숨겨진 지침)";
const sensitiveRequestPatterns = [
  new RegExp(`(?:show|reveal|print|expose|provide|dump|send).{0,50}${protectedTarget}`, "i"),
  new RegExp(`(?:what|where).{0,20}(?:is|are).{0,20}(?:your|the).{0,10}${protectedTarget}`, "i"),
  new RegExp(`${protectedTarget}.{0,50}(?:show|reveal|print|expose|provide|dump|send)`, "i"),
  /(?:show|reveal|print|expose)\s+(?:me\s+)?(?:your|the)\s+(?:prompt|instructions?|rules?|policies)\b/i,
  new RegExp(`(?:보여|알려|출력|공개|노출|제공|전송).{0,40}${protectedTargetKo}`, "i"),
  new RegExp(`${protectedTargetKo}.{0,40}(?:보여|알려|출력|공개|노출|제공|전송|뭐야|무엇)`, "i"),
];

const unsupportedClaimPatterns = [
  /매출|전환율|수익률|시장 점유율|성공을 보장|반드시 성공|업계 최고/,
  /\b(?:revenue|conversion rate|market share|guarantee(?:d)? success|best candidate|industry[- ]leading)\b/i,
];

const secretValuePatterns = [/\bsk-[a-z0-9_-]{12,}\b/i, /\b[A-Z][A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|PASSWORD|SECRET)\s*[:=]/];

export function inspectGuideInput(question: string): { allowed: true } | { allowed: false; reason: GuideGuardReason } {
  const normalized = question.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > GUIDE_LIMITS.question) return { allowed: false, reason: "invalid_input" };
  if (instructionOverridePatterns.some((pattern) => pattern.test(normalized))) return { allowed: false, reason: "instruction_override" };
  if (sensitiveRequestPatterns.some((pattern) => pattern.test(normalized))) return { allowed: false, reason: "sensitive_request" };
  return { allowed: true };
}

export function normalizeGuideHistory(history: GuideHistoryMessage[] = []): GuideHistoryMessage[] {
  return history
    .slice(-GUIDE_LIMITS.historyMessages)
    .map((message) => ({ role: message.role, content: message.content.replace(/\s+/g, " ").trim().slice(0, GUIDE_LIMITS.historyPrompt) }))
    .filter((message) => message.content.length > 0 && inspectGuideInput(message.content).allowed);
}

export function guardedGuideAnswer(reason: GuideGuardReason, locale: GuideLocale): string {
  if (locale === "en") {
    if (reason === "invalid_input") return "I can answer a portfolio question of up to 500 characters. Ask me about my frontend work, AI Agent experience, or hiring fit.";
    if (reason === "instruction_override") return "I can’t change or reveal this guide’s operating instructions. I can walk you through my verified frontend and AI Agent work. Which area would help with your hiring decision?";
    return "I can’t provide credentials or private data. I can walk you through my verified frontend and AI Agent work. Which area would help with your hiring decision?";
  }
  if (reason === "invalid_input") return "저는 500자 이내의 포트폴리오 질문에 답할 수 있습니다. 프론트엔드, AI Agent 경험, 채용 적합성 중 하나를 물어봐 주세요.";
  if (reason === "instruction_override") return "저는 이 안내의 운영 지침을 바꾸거나 공개하지 않습니다. 대신 검증된 프론트엔드와 AI Agent 경험을 설명드릴 수 있습니다. 채용 판단에 필요한 영역부터 살펴볼까요?";
  return "저는 인증 정보나 비공개 데이터를 제공하지 않습니다. 대신 검증된 프론트엔드와 AI Agent 경험을 설명드릴 수 있습니다. 채용 판단에 필요한 영역부터 살펴볼까요?";
}

export function validateGuideAnswer(answer: string, locale: GuideLocale, evidence: string[], intent?: GuideIntent, question = ""): string | null {
  const normalized = answer.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  if (!normalized || normalized.length > GUIDE_LIMITS.answer) return null;
  if (/```|<\/?[a-z][^>]*>|^\s*(?:#{1,6}|[-*>]|\d+\.)\s/m.test(normalized)) return null;
  if (unsupportedClaimPatterns.some((pattern) => pattern.test(normalized))) return null;
  if (sensitiveRequestPatterns.some((pattern) => pattern.test(normalized))) return null;
  if (secretValuePatterns.some((pattern) => pattern.test(normalized))) return null;
  if (locale === "en" && !/\b(?:I|I'm|I've|my|me)\b/i.test(normalized)) return null;
  if (locale === "en" && /[가-힣]/.test(normalized)) return null;
  if (locale === "ko" && !/(?:저는|제가|저의|저를|저에게)/.test(normalized)) return null;
  if (/(?:WiseAI.{0,120}LayoutEditor|LayoutEditor.{0,120}WiseAI)/i.test(normalized)) return null;
  if (intent === "hiring" && !/WiseAI|SBT|Infoin|제이셋|company|회사/i.test(question) && /WiseAI|SBT Global|Infoin|JSET/i.test(normalized)) return null;
  if (intent === "openalarm" && /일정|일상|강화|사용자 경험|입력|출력|사용 사례|schedule|routine|strengthen|user experience|input|output|use case/i.test(normalized)) return null;
  if ((intent === "openstock" || intent === "opendata" || intent === "openalarm") && /보여드릴|알려드릴|설명드릴까요|확인해 보실까요|would you like|I can show|I can explain|which .{0,40}(?:help|explore|explain)/i.test(normalized)) return null;

  const allowedNumbers = new Set(evidence.join(" ").match(/\d+(?:\.\d+)?/g) ?? []);
  const answerNumbers = normalized.match(/\d+(?:\.\d+)?/g) ?? [];
  if (answerNumbers.some((number) => !allowedNumbers.has(number))) return null;
  return normalized;
}
