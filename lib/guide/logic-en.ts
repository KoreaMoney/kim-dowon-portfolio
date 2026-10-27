import { detectNamedCompany, fallbackCompanyAnswer, greetingPattern, isIdentityQuestion, type GuideIntent } from "./logic";
import { CONTACT } from "@/lib/contact";

export const englishPortfolioFacts = {
  career: [
    "I have 5 years of experience building and improving both Frontend products and AI Agents.",
    "I currently work at WiseAI as AI Agent Pro · Frontend, building a hospital consultation and booking Agent and a real-time translation Agent for 10 languages.",
    "I also work as Founder · AI Product Engineer at OpenDoorLabs, where I design and operate OpenStockAI, OpenDataLabs, and OpenAlarm.",
    "I previously worked at SBT Global as a Frontend Engineer · AI Agent and at Infoin as a Frontend Engineer.",
    "I worked at JSET StatsChipPAC Korea Co., Ltd. as a QA ShiftLeader and built a process defect tracking dashboard.",
  ],
  frontend: [
    "I build frontend products and Agent operations interfaces with React, Next.js, and TypeScript.",
    "At SBT Global, I reduced AI LayoutEditor loading time from 45 seconds to 8 seconds in internal measurements, lowered memory usage by 40%, and worked with more than 100 components.",
    "At Infoin, I reduced 3D digital twin loading time from 35 seconds to 15 seconds and memory usage from 1.95GB to 912MB.",
    "I value interfaces where the user's next choice is clear and state changes are predictable.",
  ],
  agent: [
    "I designed and built the request, language routing, context retention, and result delivery flow for a real-time translation Agent supporting 10 languages.",
    "At WiseAI, I removed duplicate model calls and reduced translation processing time from 15 seconds to 7 seconds in internal measurements.",
    "In a hospital consultation and booking Agent, I connected hospital information, AI consultation, staff handoff, and reservation flows covering create, view, change, and cancel operations.",
    "I built a Browser + Observer Agent and the AX Agent Admin interface.",
  ],
  projects: [
    "I documented 19 builds in this portfolio.",
    "For OpenStockAI, I verify role-based research and decisions with 300 representative queries and 175 routing contract tests.",
    "For OpenDataLabs, I converted 8 papers into 40 requirements and 40 tests.",
    "For OpenAlarm, I implemented 3-stage wake-up, preparation, and departure notifications with an AI diary reflection.",
    "I released version v0.4.7 of the sweet-diagram npm package.",
  ],
  collaboration: [
    "I translate a user's words into context, reproduction conditions, and completion criteria that a team can execute.",
    "I solve problems by observing signals, narrowing the cause, applying a patch, and leaving regression tests.",
    "I design the screen and Agent flow as one product journey that helps the user finish the job.",
  ],
  contact: [
    `My email address is ${CONTACT.email}.`,
    `My phone number is ${CONTACT.phoneDisplay}.`,
    `My GitHub account is ${CONTACT.githubHandle}, and my LinkedIn profile is ${CONTACT.linkedinLabel}.`,
  ],
} as const;

const outOfScopePatterns = [
  /\bweather\b|\brestaurants?\b|\bpolitics?\b|\bnews\b/,
  /날씨|맛집|정치|뉴스/,
  /\b(?:salary|compensation|pay expectations?)\b|연봉|급여/i,
  /\b(?:stock|crypto|bitcoin|exchange rate)\b.*\b(?:price|predict|recommend|forecast)\b/,
  /\b(?:write|build|create|implement|debug|fix)\s+(?:me\s+|my\s+)?(?:a\s+|an\s+)?(?:function|code|program|app)\b/,
  /\b(?:someone|developer)\s+other\s+than\s+(?:kim\s+)?dowon\b/,
];

function includesAny(question: string, keywords: string[]): boolean {
  return keywords.some((keyword) => question.includes(keyword));
}

export function detectEnglishGuideIntent(question: string): GuideIntent {
  const normalized = question.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim();
  if (outOfScopePatterns.some((pattern) => pattern.test(normalized))) return "out_of_scope";
  if (greetingPattern.test(normalized)) return "greeting";
  if (normalized.includes("openstock")) return "openstock";
  if (normalized.includes("opendata")) return "opendata";
  if (normalized.includes("openalarm")) return "openalarm";
  if (normalized.includes("프로젝트") || /\bprojects?\b/.test(normalized)) return "projects";
  if (/(?:frontend|front-end|front end|프론트)/.test(normalized) && /(?:ai agent|agents?|에이전트)/.test(normalized)) return "hiring";
  if (includesAny(normalized, ["contact", "email", "e-mail", "phone", "github", "linkedin", "reach you", "get in touch", "연락", "이메일", "메일", "전화"])) return "contact";
  if (/\bwhy\b.*\bhire\b|\bhire\s+(?:you|him|kim)|\bcandidate\b|\brecruit(?:ing|er)?\b|\b(?:weakness(?:es)?|shortcomings?|gaps?|concerns?|risks?|downsides?|limitations?)\b/.test(normalized) || includesAny(normalized, ["채용", "뽑", "지원", "강점", "약점", "단점", "부족", "우려", "리스크", "보완", "왜", "커뮤니케이션", "문제 해결"])) return "hiring";
  if (/\bui\b/.test(normalized) || includesAny(normalized, ["frontend", "front-end", "front end", "react", "next.js", "nextjs", "typescript", "user interface", "performance", "component", "3d", "digital twin", "layouteditor", "프론트", "성능", "컴포넌트"])) return "frontend";
  if (includesAny(normalized, ["ai agent", "agent experience", "llm", "translation agent", "booking agent", "browser agent", "observer agent", "langgraph", "langchain", "wise dental", "wisedental", "와이즈덴탈", "에이전트", "번역", "예약", "브라우저"])) return "agent";
  if (includesAny(normalized, ["project", "portfolio", "builds", "case study", "openstock", "openalarm", "opendata", "sweet-diagram", "sweet diagram", "what did you build", "what have you built", "프로젝트", "포트폴리오", "성과", "숫자"])) return "projects";
  if (includesAny(normalized, ["career", "work history", "employment", "companies", "company", "years of experience", "current role", "previous role", "where did you work", "where have you worked", "worked at", "experience", "wiseai", "wise ai", "opendoorlabs", "opendoor", "sbt", "infoin", "jset", "statschippac", "경력", "회사", "이력", "몇 년", "다닌", "다녔", "와이즈", "오픈도어", "에스비티", "인포인", "제이셋", "스태츠칩팩"])) return "career";
  if (includesAny(normalized, ["strength", "strong point", "fit for", "value to", "work with you", "problem solving", "collaboration", "communication", "협업"])) return "hiring";
  if (includesAny(normalized, ["kim dowon", "dowon kim", "developer", "introduce yourself", "about you", "who are you", "skills", "work style", "product", "user value", "what do you do", "김도원", "개발자", "소개", "역량", "경험", "업무", "제품", "사용자", "가치"]) || isIdentityQuestion(normalized)) return "general";
  return "out_of_scope";
}

export function fallbackEnglishGuideAnswer(intent: GuideIntent, question = ""): string {
  if (intent === "hiring" && /\b(?:weakness(?:es)?|shortcomings?|gaps?|concerns?|risks?|downsides?|limitations?|shouldn['’]t hire)\b/i.test(question)) return "I won’t invent a personal weakness that the portfolio evidence cannot support. My record shows strength in connecting Frontend and AI Agent work, while the fit with your role still needs a concrete interview discussion. Share the role’s main expectation, and I’ll separate relevant proof from areas you should test further.";
  if (intent === "hiring") return "I build and improve both Frontend products and AI Agents. I reduced AI LayoutEditor loading from 45 seconds to 8 seconds and memory use by 40%, while OpenStockAI uses 300 representative queries and 175 routing contract tests. Would frontend performance or AI Agent verification help your hiring decision more?";
  if (intent === "frontend") return "I build product interfaces and operations tools with React, Next.js, and TypeScript. I reduced AI LayoutEditor loading from 45 seconds to 8 seconds and memory use by 40%. Would you like the 3D interface case or the editing tool case?";
  if (intent === "agent") return "I built hospital consultation and booking, a translation Agent for 10 languages, and Browser + Observer Agents, along with the AX Agent Admin. I verify OpenStockAI with 300 representative queries and 175 routing contract tests, and I converted 8 papers into 40 requirements and 40 tests for OpenDataLabs. I implemented 3-stage notifications and an AI diary reflection in OpenAlarm.";
  if (intent === "openstock") return "I verify role-based research and decisions in OpenStockAI with 300 representative queries and 175 routing contract tests. This portfolio does not document the routing architecture or detailed test criteria.";
  if (intent === "opendata") return "I turned 8 papers into 40 product requirements and 40 tests for OpenDataLabs. This portfolio does not document the conversion procedure or detailed test criteria.";
  if (intent === "openalarm" && /diary|reflection/i.test(question)) return "I implemented an AI diary reflection in OpenAlarm. This portfolio does not document its detailed behavior.";
  if (intent === "openalarm") return "I built OpenAlarm with 3-stage wake-up, preparation, and departure notifications plus an AI diary reflection. This portfolio does not document the Agent architecture or implementation stack.";
  if (intent === "projects") return "I documented 19 builds across Frontend, AI Agents, and 3D products. OpenStockAI uses 300 representative queries and 175 routing contract tests. Would you like me to choose the project closest to your role?";
  if (intent === "career") {
    const company = detectNamedCompany(question);
    if (company) return fallbackCompanyAnswer(company, "en");
    return "I currently work as AI Agent Pro · Frontend at WiseAI while also serving as Founder · AI Product Engineer at OpenDoorLabs. I started with QA field tools and expanded into 3D frontend and AI product development. Would you like my current scope or results from a previous company first?";
  }
  if (intent === "contact") return "I can be reached by email or phone. You can also review my public work through my GitHub and LinkedIn profiles.";
  if (intent === "greeting") return "Hello! I'm Kim Dowon, and I build products that connect Frontend and AI Agents. Ask me about my hiring strengths, representative projects, or how I work with teams.";
  if (intent === "out_of_scope") return "That topic sits outside this guide. I can share verified evidence from my Frontend and AI Agent work. Would my hiring strengths or a representative project help you more?";
  return "I build and improve both Frontend products and AI Agents. I make choices and state clear in the interface, then connect Agent lookup and validation to the user's completed task. Would product results or my working style help you more?";
}
