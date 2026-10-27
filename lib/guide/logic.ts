import {
  detectEnglishGuideIntent,
  englishPortfolioFacts,
  fallbackEnglishGuideAnswer,
} from "./logic-en";
import type { GuideConversationMemory, GuideEvidenceId, GuideHistoryMessage, GuideTargetRole } from "./safety";
import { CONTACT } from "@/lib/contact";

export type GuideIntent = "career" | "frontend" | "agent" | "openstock" | "opendata" | "openalarm" | "projects" | "hiring" | "contact" | "general" | "out_of_scope";
export type GuideLocale = "ko" | "en";

export const portfolioFacts = {
  career: [
    "저는 Frontend와 AI Agent를 직접 구축하고 개선하는 5년 경력의 개발자입니다.",
    "저는 현재 WiseAI에서 AI Agent Pro · Frontend로 병원 상담예약 Agent와 10개 언어 번역 Agent를 개발합니다.",
    "저는 OpenDoorLabs의 Founder · AI Product Engineer로 OpenStockAI, OpenDataLabs, OpenAlarm을 설계하고 운영합니다.",
    "저는 SBT Global에서 Frontend Engineer · AI Agent, Infoin에서 Frontend Engineer로 일했습니다.",
    "저는 제이셋스태츠칩팩코리아(유)에서 QA ShiftLeader 책임으로 공정 불량 추적 대시보드를 개발했습니다.",
  ],
  frontend: [
    "저는 React, Next.js, TypeScript 기반 프론트엔드와 Agent 운영 화면을 개발합니다.",
    "저는 SBT Global에서 AI LayoutEditor 로딩을 내부 측정 45초에서 8초로 줄이고 메모리 사용량을 40% 낮췄으며 100개 이상 컴포넌트를 다뤘습니다.",
    "저는 Infoin에서 3D 디지털 트윈 로딩을 35초에서 15초로 줄이고 메모리를 1.95GB에서 912MB로 낮췄습니다.",
    "저는 사용자의 다음 선택이 명확하고 상태 변화가 예측 가능한 UI를 중요하게 봅니다.",
  ],
  agent: [
    "저는 10개 언어 실시간 번역 Agent의 요청, 언어 분기, 문맥 유지, 결과 반환 흐름을 직접 설계하고 개발했습니다.",
    "저는 WiseAI에서 중복 모델 호출을 제거해 번역 처리 시간을 내부 측정 15초에서 7초로 줄였습니다.",
    "저는 병원 상담예약 Agent에서 병원 정보, AI 상담, 상담원 연결, 예약 생성·조회·변경·취소 흐름을 연결했습니다.",
    "저는 Browser + Observer Agent와 AX Agent Admin을 개발했습니다.",
  ],
  projects: [
    "저는 포트폴리오에 19개 build를 정리했습니다.",
    "저는 OpenStockAI에서 300개 대표 질의와 175개 routing 계약 테스트로 전문 역할별 조사와 판단을 검증합니다.",
    "저는 OpenDataLabs에서 8개 논문을 40개 요구사항과 40개 테스트로 변환했습니다.",
    "저는 OpenAlarm에 기상·준비·출발 3단계 알림과 AI 일기 회고를 구현했습니다.",
    "저는 sweet-diagram npm 패키지 공개 버전 v0.4.7을 배포했습니다.",
  ],
  collaboration: [
    "저는 사용자 표현을 맥락, 재현 조건, 완료 기준으로 바꿔 팀이 실행할 수 있는 티켓으로 전달합니다.",
    "저는 신호 관찰, 원인 범위 축소, patch, 회귀 테스트 순서로 문제를 해결합니다.",
    "저는 화면과 Agent 흐름을 분리하지 않고 사용자가 일을 끝내는 전체 제품 흐름으로 설계합니다.",
  ],
  contact: [
    `저의 이메일은 ${CONTACT.email}입니다.`,
    `저의 전화번호는 ${CONTACT.phoneDisplay}입니다.`,
    `저의 GitHub 계정은 ${CONTACT.githubHandle}, LinkedIn은 ${CONTACT.linkedinLabel}입니다.`,
  ],
} as const;

const keywordGroups: Array<[GuideIntent, string[]]> = [
  ["hiring", ["채용", "뽑", "지원", "강점", "약점", "단점", "부족", "우려", "리스크", "보완", "함께", "커뮤니케이션", "문제 해결"]],
  ["frontend", ["프론트", "frontend", "react", "next", "ui", "성능", "컴포넌트", "3d"]],
  ["agent", ["agent", "에이전트", "llm", "번역", "예약", "브라우저"]],
  ["projects", ["프로젝트", "포트폴리오", "openstock", "openalarm", "opendata", "sweet", "성과", "숫자"]],
  ["career", ["경력", "회사", "이력", "몇 년", "wiseai", "sbt", "infoin", "제이셋"]],
  ["contact", ["연락", "이메일", "메일", "전화", "github", "linkedin"]],
];

const generalScopeKeywords = [
  "김도원", "개발자", "소개", "어떤 사람", "누구", "기술", "역량", "경험", "업무", "제품", "사용자", "가치", "협업", "문제", "장점", "잘하는", "성장", "일하는 방식",
];

const outOfScopePatterns = [
  /김도원\s*말고/,
  /날씨|맛집|정치|뉴스|연봉|급여/,
  /(?:오늘|현재|실시간|이번\s*주).*(?:주가|코인|환율)/,
  /(?:주가|코인|환율).*(?:알려|예측|추천|전망)/,
  /(?:함수|코드|프로그램|앱).*(?:만들어|작성해|구현해|짜줘|고쳐|풀어)/,
  /(?:만들어|작성해|구현해|짜줘|고쳐|풀어).*(?:함수|코드|프로그램|앱)/,
];

export function detectGuideIntent(question: string, locale: GuideLocale = "ko"): GuideIntent {
  if (locale === "en") return detectEnglishGuideIntent(question);
  const normalized = question.toLowerCase();
  if (outOfScopePatterns.some((pattern) => pattern.test(normalized))) return "out_of_scope";
  if (normalized.includes("openstock")) return "openstock";
  if (normalized.includes("opendata")) return "opendata";
  if (normalized.includes("openalarm")) return "openalarm";
  if (normalized.includes("프로젝트") || /\bprojects?\b/.test(normalized)) return "projects";
  if (/(?:frontend|프론트)/.test(normalized) && /(?:ai agent|agent|에이전트)/.test(normalized)) return "hiring";
  if (/(?:왜.*채용|채용.*왜)/.test(normalized)) return "hiring";
  const matched = keywordGroups.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0];
  if (matched) return matched;
  return generalScopeKeywords.some((keyword) => normalized.includes(keyword)) ? "general" : "out_of_scope";
}

const followUpPatterns = [
  /(?:더|좀 더)\s*(?:자세히|구체적으로)|예시|사례|그중|그건|그 부분|그 제품|그 프로젝트|그 agent|어떻게 했|왜 그런|AI 일기|일기 회고|3단계 알림|대표 질의|routing|계약 테스트|논문|요구사항/i,
  /\b(?:tell me more|more detail|concrete example|an example|how so|which one|that result|that project|that product|that agent|what about that|go on|elaborate|AI diary|diary reflection|3-stage|representative queries|routing|contract tests?|papers?|requirements?|test criteria)\b/i,
];

const explicitOffTopicPatterns = [
  /날씨|맛집|정치|뉴스|연봉|급여|주가|코인|비트코인|환율/,
  /\b(?:weather|restaurants?|politics?|news|salary|compensation|stock price|crypto|bitcoin|exchange rate)\b/i,
];

export function resolveGuideIntent(question: string, locale: GuideLocale = "ko", history: GuideHistoryMessage[] = []): GuideIntent {
  const directIntent = detectGuideIntent(question, locale);
  if (explicitOffTopicPatterns.some((pattern) => pattern.test(question))) return "out_of_scope";
  const isFollowUp = followUpPatterns.some((pattern) => pattern.test(question));
  if (!isFollowUp || (directIntent !== "out_of_scope" && directIntent !== "general")) return directIntent;

  for (const message of [...history].reverse()) {
    const previousIntent = detectGuideIntent(message.content, locale);
    if (previousIntent !== "out_of_scope") return previousIntent;
  }
  return directIntent;
}

type GuideFacts = {
  career: readonly string[];
  frontend: readonly string[];
  agent: readonly string[];
  projects: readonly string[];
  collaboration: readonly string[];
  contact: readonly string[];
};

function retrieveEvidenceForFacts(intent: GuideIntent, targetRole: GuideTargetRole, facts: GuideFacts): string[] {
  if (intent === "projects") {
    if (targetRole === "frontend") return [...facts.frontend];
    if (targetRole === "agent") return [...facts.agent, ...facts.projects.slice(1, 4)];
    return [facts.projects[0], ...facts.frontend.slice(1, 3), ...facts.agent, ...facts.projects.slice(1, 4)];
  }
  if ((intent === "hiring" || intent === "general") && targetRole === "frontend") {
    return [facts.career[0], ...facts.frontend, ...facts.collaboration];
  }
  if ((intent === "hiring" || intent === "general") && targetRole === "agent") {
    return [facts.career[0], ...facts.agent, ...facts.projects.slice(1, 4), ...facts.collaboration];
  }
  if (intent === "hiring") return [...facts.career.slice(0, 2), ...facts.frontend.slice(0, 2), ...facts.agent.slice(0, 2), ...facts.collaboration];
  if (intent === "frontend") return [...facts.frontend, ...facts.collaboration.slice(1)];
  if (intent === "agent") return [...facts.agent, ...facts.projects.slice(1, 4), ...facts.collaboration.slice(2)];
  if (intent === "openstock") return [facts.projects[1]];
  if (intent === "opendata") return [facts.projects[2]];
  if (intent === "openalarm") return [facts.projects[3]];
  if (intent === "career") return [...facts.career, facts.projects[0]];
  if (intent === "contact") return [...facts.contact];
  if (intent === "out_of_scope") return [];
  return [facts.career[0], facts.frontend[0], facts.agent[0], facts.projects[0], facts.collaboration[2]];
}

export function retrieveGuideEvidence(intent: GuideIntent, locale: GuideLocale = "ko", targetRole: GuideTargetRole = "unknown"): string[] {
  return retrieveEvidenceForFacts(intent, targetRole, locale === "en" ? englishPortfolioFacts : portfolioFacts);
}

const suggestionsByIntent: Record<GuideIntent, Record<GuideLocale, string[]>> = {
  hiring: {
    ko: ["프론트엔드 강점은 무엇인가요?", "AI Agent 경험을 알려주세요", "문제를 어떻게 해결하나요?"],
    en: ["What are your frontend strengths?", "Tell me about your AI Agent experience", "How do you solve problems?"],
  },
  frontend: {
    ko: ["성능을 개선한 사례가 있나요?", "3D 프론트엔드 경험은?", "코드 품질 원칙은 무엇인가요?"],
    en: ["What performance improvements have you made?", "What is your 3D frontend experience?", "What are your code quality principles?"],
  },
  agent: {
    ko: ["번역 Agent를 어떻게 만들었나요?", "예약 Agent가 하는 일은?", "OpenStockAI는 어떻게 검증했나요?", "OpenAlarm은 어떤 Agent인가요?"],
    en: ["How did you build the translation Agent?", "What does the booking Agent do?", "How did you verify OpenStockAI?", "What kind of Agent is OpenAlarm?"],
  },
  openstock: {
    ko: ["OpenStockAI의 검증 수치는?", "전문 역할별 조사와 판단이란?", "다른 AI Agent 경험은?"],
    en: ["What are OpenStockAI's verification figures?", "What role-based work is documented?", "What other AI Agents have you built?"],
  },
  opendata: {
    ko: ["OpenDataLabs의 검증 수치는?", "OpenDataLabs에서 확인 가능한 성과는?", "다른 AI Agent 경험은?"],
    en: ["What are OpenDataLabs' verification figures?", "What documented results does OpenDataLabs have?", "What other AI Agents have you built?"],
  },
  openalarm: {
    ko: ["OpenAlarm에서 구현한 기능은?", "OpenAlarm의 3단계 알림은?", "다른 AI Agent 경험은?"],
    en: ["What did you implement in OpenAlarm?", "What are OpenAlarm's three notification stages?", "What other AI Agents have you built?"],
  },
  projects: {
    ko: ["OpenStockAI를 설명해 주세요", "OpenAlarm은 어떤 제품인가요?", "19개 프로젝트를 보고 싶어요"],
    en: ["Tell me about OpenStockAI", "What is OpenAlarm?", "Show me the 19 projects"],
  },
  career: {
    ko: ["현재 어떤 일을 하나요?", "회사별 역할을 알려주세요", "대표 성과 숫자는?"],
    en: ["What are you working on now?", "What was your role at each company?", "What are your main measurable results?"],
  },
  contact: {
    ko: ["이메일을 알려주세요", "GitHub은 어디인가요?", "어떤 협업을 찾고 있나요?"],
    en: ["What is your email address?", "Where can I find your GitHub?", "What collaboration are you looking for?"],
  },
  general: {
    ko: ["김도원의 강점은 무엇인가요?", "대표 프로젝트를 알려주세요", "AI Agent 경험을 알려주세요"],
    en: ["Why should we hire you?", "What are your representative projects?", "Tell me about your AI Agent experience"],
  },
  out_of_scope: {
    ko: ["채용하면 좋은 점은?", "프론트엔드 역량 요약", "대표 프로젝트 추천"],
    en: ["Why should we hire you?", "Summarize your frontend strengths", "Recommend a representative project"],
  },
};

export function guideSuggestions(intent: GuideIntent, locale: GuideLocale = "ko", targetRole: GuideTargetRole = "unknown"): string[] {
  if (intent === "projects") {
    if (targetRole === "frontend") return locale === "en" ? ["Tell me about AI LayoutEditor", "What is your 3D frontend experience?"] : ["AI LayoutEditor를 설명해 주세요", "3D 프론트엔드 경험은?"];
    if (targetRole === "agent") return suggestionsByIntent.agent[locale].slice(0, 3);
  }
  if (intent === "hiring" || intent === "general") {
    if (targetRole === "frontend") return suggestionsByIntent.frontend[locale];
    if (targetRole === "agent") return suggestionsByIntent.agent[locale].slice(0, 3);
  }
  return suggestionsByIntent[intent][locale];
}

export function isHiringConcernQuestion(question: string): boolean {
  return /약점|단점|부족|우려|리스크|보완|채용하지|weakness|shortcoming|gap|concern|risk|downside|limitation|shouldn['’]t hire/i.test(question);
}

type EvidenceStep = { anyOf: GuideEvidenceId[] } & Record<GuideLocale, string>;

type HiringStepSet = {
  steps: EvidenceStep[];
  wrapUp: Record<GuideLocale, string>;
};

const hiringStepSets: Record<"frontend" | "agent" | "general", HiringStepSet> = {
  frontend: {
    steps: [
      {
        anyOf: ["layouteditor"],
        ko: "저는 프론트엔드 포지션에서 제품 UI 구현과 측정 가능한 성능 개선을 함께 맡을 수 있습니다. AI LayoutEditor 로딩을 내부 측정 45초에서 8초로 줄이고 메모리 사용량을 40% 낮췄습니다.",
        en: "For a Frontend role, I bring product UI work plus measured performance improvement. I reduced AI LayoutEditor loading from 45 seconds to 8 seconds in internal measurements and lowered memory use by 40%.",
      },
      {
        anyOf: ["digital-twin"],
        ko: "저는 3D 디지털 트윈에서도 로딩을 35초에서 15초로 줄이고 메모리를 1.95GB에서 912MB로 낮췄습니다. 화면에 드러난 문제를 측정 가능한 프론트엔드 병목으로 좁혀 개선한 사례입니다.",
        en: "I also reduced a 3D digital twin's loading time from 35 seconds to 15 seconds and memory use from 1.95GB to 912MB. That work reflects how I narrow a visible product problem to a measurable frontend bottleneck.",
      },
      {
        anyOf: ["collaboration"],
        ko: "저는 사용자 표현을 맥락, 재현 조건, 완료 기준으로 바꾸고 회귀 테스트까지 남겨 프론트엔드 동작을 팀이 함께 검증할 수 있게 합니다. 화면 완성보다 합의된 완료 상태를 만드는 방식입니다.",
        en: "I make frontend behavior easier to verify by translating user language into context, reproduction conditions, completion criteria, and regression tests. That gives a team a shared definition of done, not just a finished screen.",
      },
    ],
    wrapUp: {
      ko: "저는 이 안내에서 확인 가능한 프론트엔드 근거를 이미 다뤘으므로 같은 수치를 반복하지 않겠습니다. 확인하려는 제품 제약이나 책임을 알려주시면 가장 가까운 기록으로 답하겠습니다.",
      en: "I have covered the verified Frontend evidence available here, so I will not recycle the same metrics. Name the product constraint or responsibility you want to test, and I will answer from the closest documented case.",
    },
  },
  agent: {
    steps: [
      {
        anyOf: ["translation-agent"],
        ko: "저는 AI Agent 포지션에서 모델 동작을 사용 가능한 제품 흐름과 검증 방법으로 연결합니다. 10개 언어 번역 Agent를 설계했고, 중복 호출을 제거해 처리 시간을 내부 측정 15초에서 7초로 줄였습니다.",
        en: "For an AI Agent role, I connect model behavior to a usable product flow and a way to verify it. I designed a translation Agent for 10 languages and reduced processing time from 15 seconds to 7 seconds in internal measurements.",
      },
      {
        anyOf: ["openstock", "opendata"],
        ko: "저는 Agent를 데모만으로 판단하지 않고 검증 기준까지 연결합니다. OpenStockAI는 300개 대표 질의와 175개 routing 계약 테스트를 사용하고, OpenDataLabs는 8개 논문을 40개 요구사항과 40개 테스트로 바꿨습니다.",
        en: "I also verify Agent behavior rather than judging it by a demo alone. OpenStockAI uses 300 representative queries and 175 routing contract tests, while OpenDataLabs turns 8 papers into 40 requirements and 40 tests.",
      },
      {
        anyOf: ["booking-agent", "browser-admin"],
        ko: "저는 병원 상담예약 Agent, Browser + Observer Agent, AX Agent Admin도 개발했습니다. 사용자 대화부터 브라우저 실행과 관찰, 관리자 확인 화면까지 연결한 경험입니다.",
        en: "I also built a hospital consultation and booking Agent, a Browser + Observer Agent, and the AX Agent Admin interface. Those cases cover the user conversation, browser execution, observation, and administrator review surfaces.",
      },
      {
        anyOf: ["openalarm"],
        ko: "저는 OpenAlarm에 기상, 준비, 출발 3단계 알림과 AI 일기 회고를 구현했습니다. 그보다 깊은 Agent 동작은 이 포트폴리오에 기록하지 않았습니다.",
        en: "I implemented OpenAlarm with three notification stages—wake-up, preparation, and departure—plus an AI diary reflection. The portfolio does not document deeper Agent mechanics for that product.",
      },
    ],
    wrapUp: {
      ko: "저는 이 안내에서 확인 가능한 AI Agent 근거를 이미 다뤘으므로 같은 사례를 반복하지 않겠습니다. 확인하려는 Agent 책임을 알려주시면 가장 가까운 기록으로 답하겠습니다.",
      en: "I have covered the verified AI Agent evidence available here, so I will not recycle the same examples. Name the Agent responsibility you want to test, and I will answer from the closest documented case.",
    },
  },
  general: {
    steps: [
      {
        anyOf: ["layouteditor"],
        ko: "저는 Frontend와 AI Agent를 직접 구축하고 개선합니다. AI LayoutEditor 로딩을 내부 측정 45초에서 8초로 줄이고 메모리를 40% 낮췄으며, OpenStockAI는 300개 대표 질의와 175개 routing 계약 테스트로 검증합니다.",
        en: "I build and improve both Frontend products and AI Agents. I reduced AI LayoutEditor loading from 45 seconds to 8 seconds and memory use by 40% in internal measurements, while OpenStockAI uses 300 representative queries and 175 routing contract tests.",
      },
      {
        anyOf: ["opendata", "collaboration"],
        ko: "저는 Agent 품질도 명시적인 검증 기준으로 연결합니다. OpenDataLabs에서 8개 논문을 40개 요구사항과 40개 테스트로 바꿨고, 사용자 표현은 완료 기준과 회귀 테스트로 정리합니다.",
        en: "I also connect Agent quality to explicit checks: OpenDataLabs turns 8 papers into 40 requirements and 40 tests, and I translate user language into completion criteria and regression tests.",
      },
      {
        anyOf: ["translation-agent", "booking-agent"],
        ko: "저는 10개 언어 번역 Agent와 병원 상담예약 Agent도 설계해 모델 동작을 사용자의 업무 완료까지 연결했습니다.",
        en: "I also designed a translation Agent for 10 languages and a hospital consultation and booking Agent, connecting model behavior to the user's completed task.",
      },
      {
        anyOf: ["digital-twin"],
        ko: "저는 프론트엔드 영역에서 3D 디지털 트윈 로딩을 35초에서 15초로 줄이고 메모리를 1.95GB에서 912MB로 낮춘 경험도 있습니다.",
        en: "On the Frontend side, I also reduced a 3D digital twin's loading time from 35 seconds to 15 seconds and memory use from 1.95GB to 912MB.",
      },
      {
        anyOf: ["openalarm", "browser-admin"],
        ko: "저는 OpenAlarm의 3단계 알림과 AI 일기 회고를 구현했고, Browser + Observer Agent와 AX Agent Admin도 개발했습니다.",
        en: "I also implemented OpenAlarm's three-stage notifications and AI diary reflection, and built a Browser + Observer Agent with the AX Agent Admin interface.",
      },
    ],
    wrapUp: {
      ko: "저는 이 안내에서 확인 가능한 교차 영역 근거를 이미 다뤘으므로 같은 사례를 반복하지 않겠습니다. 확인하려는 역할 책임을 알려주시면 가장 가까운 기록으로 답하겠습니다.",
      en: "I have covered the verified cross-functional evidence available here, so I will not recycle the same examples. Name the role responsibility you want to test, and I will answer from the closest documented case.",
    },
  },
};

export function fallbackGuideAnswer(
  intent: GuideIntent,
  locale: GuideLocale = "ko",
  question = "",
  memory?: GuideConversationMemory,
): string {
  const targetRole = memory?.targetRole ?? "unknown";
  const covered = new Set(memory?.coveredEvidence ?? []);
  const askRole = targetRole === "unknown" && !memory?.roleAsked && (intent === "hiring" || intent === "general");
  if (intent === "projects") {
    if (targetRole === "frontend") return locale === "en" ? "I count AI LayoutEditor and a 3D digital twin among my representative Frontend projects. I reduced LayoutEditor loading from 45 seconds to 8 seconds in internal measurements, and reduced the 3D product's loading from 35 seconds to 15 seconds." : "저는 AI LayoutEditor와 3D 디지털 트윈을 대표 프론트엔드 프로젝트로 꼽습니다. LayoutEditor 로딩은 내부 측정 45초에서 8초로, 3D 제품 로딩은 35초에서 15초로 줄였습니다.";
    if (targetRole === "agent") return locale === "en" ? "I count the 10-language Translation Agent, Hospital Consultation and Booking Agent, OpenStockAI, OpenDataLabs, and OpenAlarm among my representative AI Agent projects. The documented work spans product flows, routing contract tests, research-to-requirement conversion, and three-stage notifications." : "저는 10개 언어 번역 Agent, 병원 상담예약 Agent, OpenStockAI, OpenDataLabs, OpenAlarm을 대표 AI Agent 프로젝트로 꼽습니다. 제품 흐름 구축, routing 계약 테스트, 논문 기반 요구사항 변환, 3단계 알림 구현을 각각 확인할 수 있습니다.";
    return locale === "en" ? "Among my 19 builds, I count AI LayoutEditor, the 10-language Translation Agent, OpenStockAI, the Hospital Consultation and Booking Agent, OpenDataLabs, and OpenAlarm as representative projects. They show both measured Frontend improvement and AI Agent product verification." : "저는 19개 build 가운데 AI LayoutEditor, 10개 언어 번역 Agent, OpenStockAI, 병원 상담예약 Agent, OpenDataLabs, OpenAlarm을 대표 프로젝트로 꼽습니다. 측정 가능한 프론트엔드 개선과 AI Agent 제품 검증을 함께 보여줍니다.";
  }
  if (intent === "hiring" && isHiringConcernQuestion(question)) {
    if (locale === "en") return fallbackEnglishGuideAnswer(intent, question);
    return "저는 확인된 자료만으로 개인적 약점을 꾸며 답하지 않겠습니다. 제 이력은 Frontend와 AI Agent를 연결한 제품 개발에 근거가 있고, 지원 역할의 기대와 맞지 않는 지점은 면접에서 사례로 확인해야 합니다. 역할의 핵심 기대를 알려주시면 관련 경험과 확인이 필요한 부분을 나눠 답하겠습니다.";
  }
  if (intent === "hiring" || intent === "general") {
    const stepSet = hiringStepSets[targetRole === "frontend" || targetRole === "agent" ? targetRole : "general"];
    const answer = (stepSet.steps.find((step) => step.anyOf.some((id) => !covered.has(id))) ?? stepSet.wrapUp)[locale];
    const roleQuestion = locale === "en" ? "Is this closer to a Frontend, AI Agent, or hybrid role?" : "프론트엔드, AI Agent, 두 영역을 함께 보는 포지션 중 어디에 가깝나요?";
    return askRole ? `${answer} ${roleQuestion}` : answer;
  }
  if (locale === "en") return fallbackEnglishGuideAnswer(intent, question);
  if (intent === "frontend") return "저는 React, Next.js, TypeScript로 제품 화면과 운영 도구를 만듭니다. AI LayoutEditor 로딩을 45초에서 8초로 줄이고 메모리를 40% 낮췄습니다. 3D 화면과 편집 도구 중 어느 사례를 더 보고 싶으신가요?";
  if (intent === "agent") return "저는 병원 상담예약, 10개 언어 번역, Browser + Observer Agent와 AX Agent Admin을 개발했습니다. OpenStockAI는 300개 대표 질의와 175개 routing 계약 테스트로 검증하고, OpenDataLabs는 8개 논문을 40개 요구사항과 40개 테스트로 전환했습니다. OpenAlarm에는 3단계 알림과 AI 일기 회고를 구현했습니다.";
  if (intent === "openstock") return "저는 OpenStockAI에서 전문 역할별 조사와 판단을 300개 대표 질의와 175개 routing 계약 테스트로 검증합니다. 구체적인 routing 구조와 테스트 기준은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "opendata") return "저는 OpenDataLabs에서 8개 논문을 40개 제품 요구사항과 40개 테스트로 바꿨습니다. 구체적인 변환 절차와 테스트 기준은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "openalarm" && /일기|회고/.test(question)) return "저는 OpenAlarm에 AI 일기 회고를 구현했습니다. 회고의 구체적인 동작 방식은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "openalarm") return "저는 OpenAlarm에 기상, 준비, 출발을 잇는 3단계 알림과 AI 일기 회고를 구현했습니다. 구체적인 Agent 구조와 사용 기술은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "career") return "저는 현재 WiseAI의 AI Agent Pro · Frontend와 OpenDoorLabs의 Founder · AI Product Engineer 역할을 함께 맡고 있습니다. QA 현장 도구에서 시작해 3D 프론트엔드와 AI 제품 개발로 범위를 넓혔습니다. 현재 역할과 이전 회사 성과 중 어디부터 보시겠어요?";
  if (intent === "contact") return "저는 이메일과 전화로 연락을 받습니다. 저의 GitHub과 LinkedIn에서도 작업 기록을 확인할 수 있습니다.";
  if (intent === "out_of_scope") return "그 주제는 이 안내에서 다루지 않아요. 저는 Frontend와 AI Agent를 연결한 제품 경험을 검증된 근거로 설명드릴 수 있습니다. 채용 강점과 대표 프로젝트 중 무엇을 살펴보실까요?";
  return "저는 Frontend와 AI Agent를 직접 구축하고 개선합니다. 화면의 선택과 상태를 명확히 하고, Agent의 조회와 검증을 사용자의 업무 완료까지 연결합니다. 제품 성과와 일하는 방식 중 무엇이 궁금하신가요?";
}
