import type { GuideIntent, GuideLocale } from "./logic";
import {
  normalizeGuideMemory,
  type GuideConversationMemory,
  type GuideEvidenceId,
  type GuideHistoryMessage,
  type GuideTargetRole,
} from "./safety";

const roleContextKo = /포지션|직무|채용|지원자|후보|인재|팀에서|팀에|찾고|모집/;
const roleContextEn = /\b(?:position|opening|candidate|hiring|hire|recruit(?:er|ing)?|team needs?|looking for)\b/i;

export function detectExplicitTargetRole(text: string, allowBareRole = false): Exclude<GuideTargetRole, "unknown"> | undefined {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (/openstock|opendata|openalarm/i.test(normalized)) return undefined;

  const roleSelectionPhrase =
    roleContextKo.test(normalized) ||
    roleContextEn.test(normalized) ||
    /(?:frontend|front-end|front end|프론트(?:엔드)?|ai\s*agents?|agents?|에이전트).{0,16}역할(?:로|을)\s*(?:보고|찾|채용|모집)/i.test(normalized) ||
    /(?:frontend|front-end|front end|프론트(?:엔드)?|ai\s*agents?|agents?|에이전트)(?:로|쪽으로)\s*(?:볼|보겠|생각|전환)/i.test(normalized) ||
    /\b(?:switch|focus|target).{0,20}(?:frontend|front-end|front end|ai\s*agents?)\b/i.test(normalized) ||
    /\b(?:for|hiring for|looking for)\s+(?:an?\s+)?(?:frontend|front-end|front end|ai\s*agents?)\s+role\b/i.test(normalized);
  const bareRoleAnswer = allowBareRole && /^(?:프론트(?:엔드)?(?:요)?|ai\s*agents?(?:요)?|에이전트(?:요)?|둘\s*다(?:요)?|두\s*영역(?:요)?|하이브리드(?:요)?|frontend|front-end|front end|agent|ai\s*agent|both|hybrid)[.!?\s]*$/i.test(normalized);
  if (!roleSelectionPhrase && !bareRoleAnswer) return undefined;

  const hasFrontend = /frontend|front-end|front end|프론트(?:엔드)?/i.test(normalized);
  const hasAgent = /ai\s*agents?|agents?|에이전트/i.test(normalized);
  const explicitlyBoth = /둘\s*다|두\s*영역|함께|하이브리드|both|hybrid|combined|across both/i.test(normalized);

  if (/(?:frontend|front-end|front end|프론트(?:엔드)?).{0,24}(?:말고|아닌|제외|not).{0,24}(?:ai\s*agents?|agents?|에이전트)/i.test(normalized)) return "agent";
  if (/(?:ai\s*agents?|agents?|에이전트).{0,24}(?:말고|아닌|제외|not).{0,24}(?:frontend|front-end|front end|프론트(?:엔드)?)/i.test(normalized)) return "frontend";
  if (bareRoleAnswer && explicitlyBoth) return "hybrid";
  if (hasFrontend && hasAgent && explicitlyBoth) return "hybrid";
  if (hasFrontend && hasAgent) return "hybrid";
  if (hasFrontend) return "frontend";
  if (hasAgent) return "agent";
  return undefined;
}

export function resolveTargetRole(
  question: string,
  history: GuideHistoryMessage[] = [],
  memory?: unknown,
): GuideTargetRole {
  const safeMemory = normalizeGuideMemory(memory);
  let targetRole = safeMemory.targetRole;
  for (const message of history) {
    if (message.role !== "user") continue;
    targetRole = detectExplicitTargetRole(message.content) ?? targetRole;
  }
  return detectExplicitTargetRole(question, safeMemory.roleAsked) ?? targetRole;
}

function evidenceIdsFromAnswer(answer: string): GuideEvidenceId[] {
  const ids: GuideEvidenceId[] = [];
  if (/LayoutEditor|45\s*(?:초|seconds?|s).{0,20}8\s*(?:초|seconds?|s)|메모리.{0,12}40%|memory.{0,12}40%/i.test(answer)) ids.push("layouteditor");
  if (/3D|digital twin|35\s*(?:초|seconds?|s).{0,20}15\s*(?:초|seconds?|s)|1\.95GB|912MB/i.test(answer)) ids.push("digital-twin");
  if (/번역 Agent|translation Agent|10개 언어|10 languages|15\s*(?:초|seconds?|s).{0,20}7\s*(?:초|seconds?|s)/i.test(answer)) ids.push("translation-agent");
  if (/상담예약|hospital consultation|booking Agent/i.test(answer)) ids.push("booking-agent");
  if (/Browser \+ Observer|AX Agent Admin/i.test(answer)) ids.push("browser-admin");
  if (/OpenStockAI/i.test(answer)) ids.push("openstock");
  if (/OpenDataLabs/i.test(answer)) ids.push("opendata");
  if (/OpenAlarm/i.test(answer)) ids.push("openalarm");
  if (/재현 조건|완료 기준|회귀 테스트|reproduction conditions?|completion criteria|regression tests?/i.test(answer)) ids.push("collaboration");
  return ids;
}

function evidenceIdsForTurn(intent: GuideIntent, targetRole: GuideTargetRole): GuideEvidenceId[] {
  if (intent === "frontend") return ["layouteditor", "digital-twin"];
  if (intent === "agent") return ["translation-agent", "booking-agent", "browser-admin", "openstock", "opendata", "openalarm"];
  if (intent === "openstock") return ["openstock"];
  if (intent === "opendata") return ["opendata"];
  if (intent === "openalarm") return ["openalarm"];
  if (intent === "career") return ["career"];
  if (intent === "projects") return ["openstock", "opendata", "openalarm"];
  if (intent === "contact" || intent === "out_of_scope") return [];
  if (targetRole === "frontend") return ["layouteditor", "digital-twin", "collaboration"];
  if (targetRole === "agent") return ["translation-agent", "openstock", "collaboration"];
  return ["layouteditor", "openstock", "collaboration"];
}

export function advanceGuideMemory(
  memory: unknown,
  intent: GuideIntent,
  targetRole: GuideTargetRole,
  answer = "",
): GuideConversationMemory {
  const current = normalizeGuideMemory(memory);
  let turnEvidence = evidenceIdsForTurn(intent, targetRole);
  if (intent === "hiring" || intent === "general") {
    if (targetRole === "frontend") turnEvidence = [current.coveredEvidence.includes("layouteditor") ? "digital-twin" : "layouteditor"];
    else if (targetRole === "agent") turnEvidence = [current.coveredEvidence.includes("translation-agent") ? "openstock" : "translation-agent"];
    else if (current.coveredEvidence.includes("layouteditor")) turnEvidence = ["opendata", "collaboration"];
    else turnEvidence = ["layouteditor", "openstock"];
  }
  const mentionedEvidence = evidenceIdsFromAnswer(answer);
  if (answer.trim()) turnEvidence = mentionedEvidence;
  const coveredEvidence = [...new Set([...current.coveredEvidence, ...turnEvidence])].slice(-8);
  const roleAsked = current.roleAsked || ((intent === "hiring" || intent === "general") && targetRole === "unknown");
  return { targetRole, lastIntent: intent, coveredEvidence, roleAsked };
}

export function targetRoleLabel(targetRole: GuideTargetRole, locale: GuideLocale): string {
  if (locale === "en") {
    if (targetRole === "frontend") return "Frontend role";
    if (targetRole === "agent") return "AI Agent role";
    if (targetRole === "hybrid") return "hybrid Frontend + AI Agent role";
    return "role not specified";
  }
  if (targetRole === "frontend") return "프론트엔드 포지션";
  if (targetRole === "agent") return "AI Agent 포지션";
  if (targetRole === "hybrid") return "Frontend + AI Agent 하이브리드 포지션";
  return "포지션 미지정";
}
