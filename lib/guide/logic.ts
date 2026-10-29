import {
  detectEnglishGuideIntent,
  englishPortfolioFacts,
  fallbackEnglishGuideAnswer,
} from "./logic-en";
import type { GuideConversationMemory, GuideEvidenceId, GuideHistoryMessage, GuideTargetRole } from "./safety";
import { CONTACT } from "@/lib/contact";

export type GuideIntent = "career" | "frontend" | "agent" | "openstock" | "opendata" | "openalarm" | "projects" | "hiring" | "contact" | "general" | "greeting" | "out_of_scope";
export type GuideLocale = "ko" | "en";

export const portfolioFacts = {
  career: [
    "저는 Frontend와 AI Agent를 직접 구축하고 개선하는 5년 경력의 개발자입니다.",
    "저는 현재 WiseAI에서 AI Agent Pro · Frontend로 병원 상담예약 Agent 챗봇, 10개 언어 번역 Agent, 사내 AX Agent Admin 플랫폼을 개발합니다.",
    "저는 OpenDoorLabs의 Founder · AI Product Engineer로 OpenStockAI, OpenDataLabs, OpenAlarm을 설계하고 운영합니다.",
    "저는 SBT Global에서 Frontend Engineer · AI Agent, Infoin에서 Frontend Engineer로 일했습니다.",
    "저는 제이셋스태츠칩팩코리아(유)에서 QA ShiftLeader 책임으로 공정 불량 추적 대시보드를 개발했습니다.",
  ],
  frontend: [
    "저는 React, Next.js, TypeScript 기반 프론트엔드와 Agent 운영 화면을 개발합니다.",
    "저는 SBT Global에서 AI LayoutEditor 로딩을 내부 측정 45초에서 8초로 줄이고 메모리 사용량을 40% 낮췄으며 100개 이상 컴포넌트를 다뤘습니다.",
    "저는 SBT Global에서 Diagram 라이브러리와 커스텀 스프레드시트 엔진을 기획·개발·배포해 설계·검토 업무에 적용했습니다.",
    "저는 Infoin에서 3D 디지털 트윈 로딩을 35초에서 15초로 줄이고 메모리를 1.95GB에서 912MB로 낮췄습니다.",
    "저는 사용자의 다음 선택이 명확하고 상태 변화가 예측 가능한 UI를 중요하게 봅니다.",
  ],
  agent: [
    "저는 10개 언어 실시간 번역 Agent의 요청, 언어 분기, 문맥 유지, 결과 반환 흐름을 직접 설계하고 개발했습니다.",
    "저는 WiseAI에서 중복 모델 호출을 제거해 번역 처리 시간을 내부 측정 15초에서 7초로 줄였습니다.",
    "저는 병원 상담예약 Agent에서 병원 정보, AI 상담, 상담원 연결, 예약 생성·조회·변경·취소 흐름을 연결했습니다.",
    "저는 WiseAI에서 병원 전용 상담예약 AI Agent 챗봇을 0→1로 개발하며 의도 분석, 지식 탐색, 예약 정보 수집, 상담사 이관의 상태 기반 워크플로우를 Python·LangGraph·LangChain으로 구축했습니다.",
    "저는 병원별 진료 정책과 FAQ를 구조화해 멀티 테넌트 환경에서 병원별 맞춤 응답과 예약 흐름을 적용했습니다.",
    "저는 실제 상담 로그 기반 평가 데이터셋, 모델·프롬프트 비교 평가, 자동 회귀 테스트, Langfuse 실행 추적으로 Agent 품질을 관리했습니다.",
    "저는 비개발 직군이 병원별 Agent 설정과 운영을 제어하는 사내 AX Agent Admin 플랫폼을 0→1로 설계·구축하고, 유입 환자·예약 전환율·AI 기여 매출을 자동 집계하는 ROI 성과 리포트를 만들었습니다.",
    "저는 상담 퍼널 개선으로 챗봇 예약 전환율 40% 향상에 기여하고, 매출 기여도 20% 지표를 성과 리포트로 가시화했습니다.",
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
  ["hiring", ["채용", "뽑", "지원", "강점", "약점", "단점", "부족", "우려", "리스크", "보완", "함께", "커뮤니케이션", "문제 해결", "면접", "실패", "팀워크", "리더십", "협업", "멘토", "동료", "레퍼런스", "추천서", "성격", "성향", "인간적", "성실", "책임감", "꼼꼼", "내성", "외향", "사회성", "사교", "적극적", "mbti", "신중", "끈기", "꾸준", "친화력", "배려", "야근", "워라밸", "욕심"]],
  ["agent", ["agent", "에이전트", "llm", "번역", "예약", "브라우저", "와이즈덴탈", "wisedental", "wise dental", "챗봇", "chatbot", "chat bot", "langgraph", "langchain", "langfuse", "랭그래프", "랭체인", "ax플랫폼", "ax 플랫폼", "ax admin", "ax agent", "에이엑스", "admin", "python", "파이썬", "프롬프트", "prompt", "rag", "mcp", "채팅", "상담", "병원", "다국어", "관리자", "모델", "평가", "자동화"]],
  ["frontend", ["프론트", "frontend", "react", "next", "ui", "성능", "컴포넌트", "3d", "typescript", "타입스크립트", "javascript", "자바스크립트", "node.js", "nodejs", "로딩", "메모리", "최적화", "렌더링", "스프레드시트", "다이어그램", "diagram", "대시보드", "메타버스", "키오스크", "접근성", "반응형", "피그마", "figma", "css", "디자인 시스템", "design system", "상태 관리", "상태관리", "webgl", "그래픽"]],
  ["projects", ["프로젝트", "포트폴리오", "openstock", "openalarm", "opendata", "sweet", "성과", "숫자", "npm", "오픈소스", "오픈 소스", "open source", "패키지", "사이드"]],
  ["career", ["경력", "회사", "이력", "몇 년", "다닌", "다녔", "wiseai", "wise ai", "와이즈", "sbt", "에스비티", "infoin", "인포인", "제이셋", "스태츠칩팩", "스탯츠칩팩", "jset", "statschippac", "오픈도어", "opendoor"]],
  ["contact", ["연락", "이메일", "메일", "전화", "github", "linkedin", "깃헙", "깃허브", "링크드인", "블로그", "blog", "링크", "url"]],
];

const generalScopeKeywords = [
  "김도원", "개발자", "소개", "어떤 사람", "누구", "기술", "역량", "경험", "업무", "제품", "사용자", "가치", "협업", "문제", "장점", "잘하는", "성장", "일하는 방식",
  "언어", "스킬", "스택", "방식", "백엔드", "backend", "아키텍처", "architecture", "설계", "디자인", "문서", "애자일", "스크럼", "agile", "scrum", "프로세스", "process", "워크플로우", "workflow", "중요", "모바일", "게임", "임베디드", "ios", "android", "잘해", "제일 잘",
];

const outOfScopePatterns = [
  /김도원\s*말고/,
  /날씨|맛집|정치|뉴스|연봉|급여/,
  /(?:오늘|현재|실시간|이번\s*주).*(?:주가|코인|환율)/,
  /(?:주가|코인|환율).*(?:알려|예측|추천|전망)/,
  /(?:오늘|지금|현재|내일|어제|이번\s*주).{0,10}(?:날짜|요일|몇\s*시|시간대)|몇\s*월\s*며칠|오늘이?\s*며칠/,
  /햄버거|피자|치킨|레시피|음식|메뉴\s*추천|뭐\s*먹|영화|드라마|넷플릭스|영화관|콘서트|음악|노래|아이돌|연예인|축구|야구|농구|스포츠|여행|호텔|항공권|관광|웹툰|만화|소설|책\s*추천|게임\s*(?:추천|재밌)|재밌는?\s*게임/,
  /(?:함수|코드|프로그램|앱|알고리즘|스크립트|쿼리).{0,40}(?:만들어|작성해|구현해|개발해|짜|고쳐|풀어|리뷰해|분석해|설명해|디버깅해|바꿔)\s*(?:줘|주|달라|봐)/,
  /(?:만들어|작성해|구현해|개발해|짜|고쳐|풀어|리뷰해|분석해|설명해|디버깅해|바꿔)\s*(?:줘|주|달라|봐).{0,40}(?:함수|코드|프로그램|앱|알고리즘|스크립트|쿼리)/,
];

export type GuideCompany = "wiseai" | "opendoorlabs" | "sbt" | "infoin" | "jset";

const companyMentionPatterns: Array<[GuideCompany, RegExp]> = [
  ["wiseai", /와이즈(?!\s*덴탈)|\bwise\s*ai\b/i],
  ["opendoorlabs", /오픈\s*도어(?:\s*랩스?)?|\bopendoor(?:labs?)?\b|\bopen\s*door\s*labs?\b/i],
  ["sbt", /에스비티|\bsbt\b/i],
  ["infoin", /인포인|\binfoin\b/i],
  ["jset", /제이셋|스태츠칩팩|스탯츠칩팩|\bjset\b|stats?\s*chip\s*pac/i],
];

const companyExclusionPattern = /말고|제외|빼고|다른\s*회사|다른\s*데|other\s+than|except|besides|apart\s+from|exclude/i;

export function detectNamedCompany(question: string): GuideCompany | null {
  if (companyExclusionPattern.test(question)) return null;
  let found: GuideCompany | null = null;
  let position = Number.POSITIVE_INFINITY;
  for (const [company, pattern] of companyMentionPatterns) {
    const match = pattern.exec(question);
    if (match && match.index < position) {
      found = company;
      position = match.index;
    }
  }
  return found;
}

function companiesMentionsInOrder(text: string): GuideCompany[] {
  const found: Array<{ index: number; company: GuideCompany }> = [];
  for (const [company, pattern] of companyMentionPatterns) {
    const match = pattern.exec(text);
    if (match) found.push({ index: match.index, company });
  }
  return found.sort((a, b) => a.index - b.index).map((entry) => entry.company);
}

export function resolveNamedCompany(question: string, history: GuideHistoryMessage[] = []): GuideCompany | null {
  const direct = detectNamedCompany(question);
  if (direct) return direct;
  const ordinal = ordinalReferencePatterns.find(([pattern]) => pattern.test(question))?.[1];
  if (ordinal !== undefined && /회사|직장|직책|company|employer|workplace/i.test(question)) {
    for (const message of [...history].reverse()) {
      if (message.role !== "assistant") continue;
      const companies = companiesMentionsInOrder(message.content);
      if (!companies.length) continue;
      const index = ordinal === -1 ? companies.length - 1 : ordinal;
      return index < companies.length ? companies[index] : null;
    }
    return null;
  }
  for (const message of [...history].reverse()) {
    if (message.role === "user") {
      const company = detectNamedCompany(message.content);
      if (company) return company;
      continue;
    }
    const companies = companiesMentionsInOrder(message.content);
    if (companies.length === 1) return companies[0];
  }
  return null;
}

export const greetingPattern = /^(?:안녕(?:하세요|하십니까|히\s*가(?:세요|주세요)?)?|하이|헬로|반갑(?:습니다|워(?:요)?|네요|다)?|좋은\s*(?:아침|오후|저녁|하루)(?:이에요|예요|입니다)?|처음\s*뵙겠습니다|hi|hello|hey|yo|hiya|howdy|good\s*(?:morning|afternoon|evening|day|night)|greetings|nice\s*to\s*meet\s*you)(?:\s+there)?[\s!?.~…,]*$/i;

export function detectGuideIntent(question: string, locale: GuideLocale = "ko"): GuideIntent {
  if (locale === "en") return detectEnglishGuideIntent(question);
  const normalized = question.toLowerCase();
  if (outOfScopePatterns.some((pattern) => pattern.test(normalized))) return "out_of_scope";
  if (greetingPattern.test(normalized.trim())) return "greeting";
  if (normalized.includes("openstock")) return "openstock";
  if (normalized.includes("opendata")) return "opendata";
  if (normalized.includes("openalarm")) return "openalarm";
  if (normalized.includes("프로젝트") || /\bprojects?\b/.test(normalized)) return "projects";
  if (/(?:frontend|프론트)/.test(normalized) && /(?:ai agent|agent|에이전트)/.test(normalized)) return "hiring";
  if (/(?:왜.*채용|채용.*왜)/.test(normalized)) return "hiring";
  const matched = keywordGroups.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))?.[0];
  if (matched) return matched;
  if (/계약\s*테스트|contract\s*tests?|라우팅|routing|역할별|전문\s*역할/.test(normalized)) return "openstock";
  if (isQualityPrincipleQuestion(normalized) || /문제.{0,8}해결|해결.{0,8}방식|장애|인시던트|incident|대응|온콜/.test(normalized)) return "hiring";
  if (/layouteditor|레이아웃\s*에디터/.test(normalized)) return "frontend";
  if (/이\s*(?:사이트|포트폴리오|페이지)/.test(normalized)) return "projects";
  if (/입사\s*(?:가능|시기|일|일정|언제)/.test(normalized)) return "contact";
  if (/모니터링|monitoring|관측|observability/.test(normalized)) return "agent";
  if (/(?:현재|요즘|지금|주로|보통|오늘|이번\s*주).{0,10}(?:일|업무)|(?:어떤|무슨)\s*일을?\s*(?:하|했)|역할|담당|이직|퇴사|입사|커리어/.test(normalized)) return "career";
  if (generalScopeKeywords.some((keyword) => normalized.includes(keyword)) || isIdentityQuestion(normalized)) return "general";
  return matchSuggestedIntent(normalized) ?? "out_of_scope";
}

const followUpPatterns = [
  /자세히|자세한|구체적|설명해|예시|사례|그\s*중|그건|그 부분|그 제품|그 프로젝트|그 agent|거기|그곳|어떻게|왜 그런|그렇게|그래서|그\s*이유|이유는|왜\s*그|더 알려|더 보여|더 말해|계속|다음|AI 일기|일기 회고|3단계 알림|대표 질의|routing|계약 테스트|논문|요구사항|첫\s*번째|두\s*번째|세\s*번째|네\s*번째|다섯\s*번째|첫째|둘째|셋째|넷째|다섯째|마지막\s*(?:것|거)/i,
  /\b(?:tell me more|more detail|concrete example|an example|how so|which one|that result|that project|that product|that agent|that company|that employer|there|what about that|go on|elaborate|AI diary|diary reflection|3-stage|representative queries|routing|contract tests?|papers?|requirements?|test criteria|hardest|difficult|challenging|challenge|toughest|trickiest|how|more|continue|next|why)\b|\b(?:first|second|third|fourth|fifth|last)\s+(?:one|project|product|item|build|agent)\b/i,
];

const ordinalReferencePatterns: Array<[RegExp, number]> = [
  [/첫\s*번째(?!\s*로)|첫째(?!\s*로)|\b(?:first|1st)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 0],
  [/두\s*번째(?!\s*로)|둘째(?!\s*로)|\b(?:second|2nd)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 1],
  [/세\s*번째(?!\s*로)|셋째(?!\s*로)|\b(?:third|3rd)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 2],
  [/네\s*번째(?!\s*로)|넷째(?!\s*로)|\b(?:fourth|4th)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 3],
  [/다섯\s*번째(?!\s*로)|다섯째(?!\s*로)|\b(?:fifth|5th)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 4],
  [/여섯\s*번째(?!\s*로)|여섯째(?!\s*로)|\b(?:sixth|6th)\s+(?:one|project|product|item|build|agent|company|employer)\b/i, 5],
  [/마지막\s*(?:것|거|프로젝트|제품|항목|회사|직장)|\blast\s+(?:one|project|product|item|build|agent|company|employer)\b/i, -1],
];

type ReferableProduct = { intent: GuideIntent; label: Record<GuideLocale, string> };

const referableProjectPatterns: Array<{ referent: ReferableProduct; pattern: RegExp }> = [
  { referent: { intent: "frontend", label: { ko: "AI LayoutEditor", en: "AI LayoutEditor" } }, pattern: /레이아웃\s*에디터|\b(?:ai\s*)?layouteditor\b/i },
  { referent: { intent: "frontend", label: { ko: "3D 디지털 트윈", en: "3D Digital Twin" } }, pattern: /디지털\s*트윈|\b(?:3d\s*)?digital\s*twin\b/i },
  { referent: { intent: "frontend", label: { ko: "sweet-diagram", en: "sweet-diagram" } }, pattern: /sweet[\s-]?diagram/i },
  { referent: { intent: "frontend", label: { ko: "Diagram 라이브러리", en: "the Diagram library" } }, pattern: /다이어그램|\bdiagram\s*library\b/i },
  { referent: { intent: "frontend", label: { ko: "커스텀 스프레드시트 엔진", en: "the custom spreadsheet engine" } }, pattern: /스프레드시트|\bspreadsheet\b/i },
  { referent: { intent: "agent", label: { ko: "10개 언어 번역 Agent", en: "the 10-language Translation Agent" } }, pattern: /번역\s*agent|translation\s*agent|10개\s*언어|10\s*languages?/i },
  { referent: { intent: "agent", label: { ko: "병원 상담예약 Agent", en: "the Hospital Consultation and Booking Agent" } }, pattern: /병원\s*상담예약|상담예약\s*agent|예약\s*agent|hospital\s*consultation|booking\s*agent/i },
  { referent: { intent: "agent", label: { ko: "Browser + Observer Agent", en: "the Browser + Observer Agent" } }, pattern: /browser\s*\+\s*observer/i },
  { referent: { intent: "agent", label: { ko: "AX Agent Admin", en: "the AX Agent Admin platform" } }, pattern: /ax\s*agent\s*admin|ax\s*admin/i },
  { referent: { intent: "openstock", label: { ko: "OpenStockAI", en: "OpenStockAI" } }, pattern: /\bopenstock(?:\s*ai)?\b/i },
  { referent: { intent: "opendata", label: { ko: "OpenDataLabs", en: "OpenDataLabs" } }, pattern: /\bopendata(?:\s*labs?)?\b/i },
  { referent: { intent: "openalarm", label: { ko: "OpenAlarm", en: "OpenAlarm" } }, pattern: /\bopenalarm\b/i },
];

type ResolvedReferent = ReferableProduct;

function projectMentionsInOrder(text: string): ResolvedReferent[] {
  const found: Array<{ index: number; end: number; referent: ReferableProduct }> = [];
  for (const { referent, pattern } of referableProjectPatterns) {
    const match = pattern.exec(text);
    if (match) found.push({ index: match.index, end: match.index + match[0].length, referent });
  }
  found.sort((a, b) => a.index - b.index || b.end - a.end);
  const mentions: ResolvedReferent[] = [];
  let lastEnd = -1;
  for (const entry of found) {
    if (entry.index < lastEnd) continue;
    lastEnd = entry.end;
    mentions.push(entry.referent);
  }
  return mentions;
}

const referentialPatterns = [
  /(?:그|이|저)\s*(?:프로젝트|제품|서비스|것|거|게|사례|케이스|에이전트|agent|빌드|build|툴|도구)|거기(?:서|에|는|의)?|그곳|그\s*중(?:에서|에)?|방금(?:\s*전)?\s*(?:말한|나온|언급한|그)|아까\s*(?:말한|나온|언급한|그)|앞서\s*(?:말한|언급한)|먼저\s*언급한/i,
  /\b(?:that|the|this)\s+(?:project|product|agent|build|service|one|company|tool)\b|\b(?:about|in|of|for|on|behind|inside)\s+it\b|\bit\s+(?:work|use|handle|do|run)/i,
  ...ordinalReferencePatterns.map(([pattern]) => pattern),
];

const referentialOverrideIntents = new Set<GuideIntent>(["projects", "career", "general", "hiring", "out_of_scope"]);
const singleProductIntents = new Set<GuideIntent>(["openstock", "opendata", "openalarm"]);

export const companyLabels: Record<GuideCompany, Record<GuideLocale, string>> = {
  wiseai: { ko: "WiseAI", en: "WiseAI" },
  opendoorlabs: { ko: "OpenDoorLabs", en: "OpenDoorLabs" },
  sbt: { ko: "SBT Global", en: "SBT Global" },
  infoin: { ko: "Infoin", en: "Infoin" },
  jset: { ko: "제이셋스태츠칩팩코리아(유)", en: "JSET StatsChipPAC Korea Co., Ltd." },
};
const companyNounPattern = /회사|직장|직책|company|employer|workplace/i;
const projectNounPattern = /프로젝트|제품|서비스|에이전트|project|product|service|agent/i;

type ResolvedReferentialIntent = { intent: GuideIntent; label: string | null };

function resolveReferentialIntent(question: string, history: GuideHistoryMessage[], locale: GuideLocale): ResolvedReferentialIntent | null {
  const ordinal = ordinalReferencePatterns.find(([pattern]) => pattern.test(question))?.[1];
  if (ordinal !== undefined) {
    if (companyNounPattern.test(question) && !projectNounPattern.test(question)) return null;
    for (const message of [...history].reverse()) {
      if (message.role !== "assistant") continue;
      const mentions = projectMentionsInOrder(message.content);
      if (!mentions.length) continue;
      const index = ordinal === -1 ? mentions.length - 1 : ordinal;
      return index < mentions.length ? { intent: mentions[index].intent, label: mentions[index].label[locale] } : null;
    }
    return null;
  }
  for (const message of [...history].reverse()) {
    const mentions = projectMentionsInOrder(message.content);
    const intents = new Set(mentions.map((mention) => mention.intent));
    if (intents.size > 1) return null;
    if (intents.size === 1) {
      const labels = new Set(mentions.map((mention) => mention.label[locale]));
      return { intent: mentions[0].intent, label: labels.size === 1 ? mentions[0].label[locale] : null };
    }
  }
  return null;
}

const explicitOffTopicPatterns = [
  /날씨|맛집|정치|뉴스|연봉|급여|주가|코인|비트코인|환율|햄버거|피자|치킨|레시피|음식|메뉴\s*추천|영화|드라마|넷플릭스|영화관|콘서트|음악|노래|아이돌|연예인|축구|야구|농구|스포츠|여행|호텔|항공권|관광|웹툰|만화|소설|(?:오늘|지금|현재|내일|어제).{0,10}(?:날짜|요일|몇\s*시)/,
  /\b(?:weather|restaurants?|politics?|news|salary|compensation|stock price|crypto|bitcoin|exchange rate|foods?|burger|pizza|chicken|recipe|movies?|film|netflix|musics?|songs?|concerts?|idols?|sports?|soccer|baseball|basketball|travels?|hotels?|flights?|jokes?|lottery|lotto|dating|manga|webtoon)\b|\b(?:today'?s|current)\s+(?:date|time)\b|\bwhat (?:time|day|date) is it\b|\bwhat'?s the date\b|\bgames?\s+(?:recommend|suggest)/i,
];

export type ResolvedGuideTopic = { intent: GuideIntent; referent: string | null };

export function resolveGuideTopic(question: string, locale: GuideLocale = "ko", history: GuideHistoryMessage[] = [], fallbackIntent: GuideIntent | null = null): ResolvedGuideTopic {
  const directIntent = detectGuideIntent(question, locale);
  if (explicitOffTopicPatterns.some((pattern) => pattern.test(question))) return { intent: "out_of_scope", referent: null };
  const mentionedIntents = new Set(projectMentionsInOrder(question).map((mention) => mention.intent));
  if (mentionedIntents.size > 1 && singleProductIntents.has(directIntent)) return { intent: "projects", referent: null };
  let referentLabel: string | null = null;
  const isReferential = referentialPatterns.some((pattern) => pattern.test(question));
  if (isReferential) {
    const referent = resolveReferentialIntent(question, history, locale);
    if (referent) {
      return {
        intent: referentialOverrideIntents.has(directIntent) ? referent.intent : directIntent,
        referent: referent.label,
      };
    }
    const company = resolveNamedCompany(question, history);
    if (company) {
      referentLabel = companyLabels[company][locale];
      if (directIntent === "out_of_scope" || directIntent === "general") return { intent: "career", referent: referentLabel };
    }
  }
  const isFollowUp = followUpPatterns.some((pattern) => pattern.test(question));
  if (isFollowUp && (directIntent === "out_of_scope" || directIntent === "general")) {
    for (const message of [...history].reverse()) {
      const previousIntent = detectGuideIntent(message.content, locale);
      if (previousIntent !== "out_of_scope") return { intent: previousIntent, referent: referentLabel };
    }
    if (fallbackIntent && fallbackIntent !== "out_of_scope" && fallbackIntent !== "greeting") return { intent: fallbackIntent, referent: referentLabel };
  }
  if (isReferential && directIntent === "out_of_scope") {
    const intent = companyNounPattern.test(question) || /거기|그곳|\bthere\b/i.test(question) ? "career" : "projects";
    return { intent, referent: referentLabel };
  }
  return { intent: directIntent, referent: referentLabel };
}

export function resolveGuideIntent(question: string, locale: GuideLocale = "ko", history: GuideHistoryMessage[] = [], fallbackIntent: GuideIntent | null = null): GuideIntent {
  return resolveGuideTopic(question, locale, history, fallbackIntent).intent;
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
    return [facts.projects[0], ...facts.frontend.slice(1, 4), ...facts.agent, ...facts.projects.slice(1, 4)];
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
  if (intent === "openstock") return [facts.projects[1], facts.career[2]];
  if (intent === "opendata") return [facts.projects[2], facts.career[2]];
  if (intent === "openalarm") return [facts.projects[3], facts.career[2]];
  if (intent === "career") return [...facts.career, facts.projects[0]];
  if (intent === "contact") return [...facts.contact];
  if (intent === "greeting" || intent === "out_of_scope") return [];
  return [facts.career[0], facts.frontend[0], facts.agent[0], facts.projects[0], facts.collaboration[2]];
}

const companyEvidence: Record<GuideCompany, (facts: GuideFacts) => string[]> = {
  wiseai: (facts) => [facts.career[1], ...facts.agent],
  opendoorlabs: (facts) => [facts.career[2], ...facts.projects.slice(1, 4)],
  sbt: (facts) => [facts.career[3], facts.frontend[1], facts.frontend[2]],
  infoin: (facts) => [facts.career[3], facts.frontend[3]],
  jset: (facts) => [facts.career[4]],
};

export const companyScopableIntents = new Set<GuideIntent>(["career", "general", "hiring", "frontend", "agent", "projects"]);

export function retrieveGuideEvidence(
  intent: GuideIntent,
  locale: GuideLocale = "ko",
  targetRole: GuideTargetRole = "unknown",
  question = "",
  history: GuideHistoryMessage[] = [],
): string[] {
  const facts = locale === "en" ? englishPortfolioFacts : portfolioFacts;
  const company = companyScopableIntents.has(intent) ? resolveNamedCompany(question, history) : null;
  if (company) return companyEvidence[company](facts);
  return retrieveEvidenceForFacts(intent, targetRole, facts);
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
  greeting: {
    ko: ["김도원의 강점은 무엇인가요?", "대표 프로젝트를 알려주세요", "AI Agent 경험을 알려주세요"],
    en: ["What are your strengths?", "Tell me about your representative projects", "Tell me about your AI Agent experience"],
  },
  out_of_scope: {
    ko: ["채용하면 좋은 점은?", "프론트엔드 역량 요약", "대표 프로젝트 추천"],
    en: ["Why should we hire you?", "Summarize your frontend strengths", "Recommend a representative project"],
  },
};

function normalizePromptKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[?!.~…]+$/u, "").trim();
}

const scopedPromptIntents: Array<[string, GuideIntent]> = [
  ["AI LayoutEditor를 설명해 주세요", "frontend"],
  ["Tell me about AI LayoutEditor", "frontend"],
];

// Every prompt this UI can suggest must resolve to an answerable intent, even
// when its wording shares no keyword with the router.
const suggestedPromptIntents = new Map<string, GuideIntent>();
for (const [intent, localized] of Object.entries(suggestionsByIntent) as Array<[GuideIntent, Record<GuideLocale, string[]>]>) {
  for (const prompts of Object.values(localized)) {
    for (const prompt of prompts) suggestedPromptIntents.set(normalizePromptKey(prompt), intent);
  }
}
for (const [prompt, intent] of scopedPromptIntents) suggestedPromptIntents.set(normalizePromptKey(prompt), intent);

export function matchSuggestedIntent(question: string): GuideIntent | null {
  return suggestedPromptIntents.get(normalizePromptKey(question)) ?? null;
}

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
  return /약점|단점|부족|우려|리스크|보완|실패|실수|후회|채용하지|weakness|shortcoming|gap|concern|risk|downside|limitation|failure|mistake|regret|shouldn['’]t hire/i.test(question);
}

export function isQualityPrincipleQuestion(question: string): boolean {
  return /코드\s*품질|품질\s*(?:원칙|관리|기준|보증|향상|개선)|(?:개발|작업|코딩|엔지니어링)\s*원칙|클린\s*코드|테스트|리팩토링|코드\s*리뷰|\b(?:code\s+quality|clean\s+code|coding\s+standards?|tests?|testing|refactor(?:ing|ed)?|code\s+reviews?|reviews?\s+code)\b|\b(?:code|quality|coding|engineering|work|development)\s+principles?\b/i.test(question);
}

export function isPersonalityQuestion(question: string): boolean {
  return /성격|성향|인간적|내성|외향|사교|사회성|성실|꼼꼼|책임감|끈기|꾸준|친화력|배려|신중|욕심|야근|워라밸|mbti|어떤\s*(?:사람|개발자|팀원|동료)|일하는\s*(?:방식|스타일|사람)|\b(?:personality|introvert|extrovert|temperament|mbti|social skills?|work(?:ing)?[\s-]*styles?|work ethic|diligent|meticulous|conscientious|detail[- ]oriented|overtime|work[- ]life)\b|like (?:to work|working) with you/i.test(question);
}

export function isIdentityQuestion(question: string): boolean {
  return /김도원.{0,12}(?:누구|소개|어떤\s*(?:사람|개발자|분))|(?:너는?|당신|본인|자기).{0,12}누구|자기\s*소개|본인\s*소개|^소개(?:를|해|좀|부탁)|누구(?:야|세요|시죠|니|냐|지|입니까|인가요|이세요|에요|예요)?\s*[?？!。.~]*$|이름이?\s*(?:뭐|무엇|어떻게)|who\s+are\s+you|who\s+is\s+(?:kim\s+)?dowon|who\s+am\s+i\s+talking|introduce\s+yourself|tell\s+me\s+about\s+yourself|what.{0,5}your\s+name|your\s+name/i.test(question);
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

const companyFallbackAnswers: Record<GuideCompany, Record<GuideLocale, string>> = {
  wiseai: {
    ko: "저는 WiseAI에서 AI Agent Pro · Frontend로 병원 전용 상담예약 AI Agent 챗봇을 0→1로 개발하고, 10개 언어 실시간 번역 Agent와 사내 AX Agent Admin 플랫폼을 구축했습니다. 상담 퍼널 개선으로 챗봇 예약 전환율 40% 향상에 기여하고 매출 기여도 20% 지표를 성과 리포트로 가시화했습니다.",
    en: "At WiseAI, I work as AI Agent Pro · Frontend. I built a hospital consultation and booking AI Agent chatbot from zero to one, a real-time translation Agent for 10 languages, and an in-house AX Agent Admin platform for non-developer teams. I contributed to a 40% booking conversion improvement and surfaced the 20% AI revenue contribution in performance reporting.",
  },
  opendoorlabs: {
    ko: "저는 OpenDoorLabs의 Founder · AI Product Engineer로 OpenStockAI, OpenDataLabs, OpenAlarm을 설계하고 운영합니다. OpenStockAI는 300개 대표 질의와 175개 routing 계약 테스트로, OpenDataLabs는 8개 논문을 40개 요구사항과 40개 테스트로 검증합니다.",
    en: "At OpenDoorLabs, I work as Founder · AI Product Engineer, designing and operating OpenStockAI, OpenDataLabs, and OpenAlarm. OpenStockAI is verified with 300 representative queries and 175 routing contract tests, and OpenDataLabs turns 8 papers into 40 requirements and 40 tests.",
  },
  sbt: {
    ko: "저는 SBT Global에서 Frontend Engineer · AI Agent로 일했습니다. AI LayoutEditor 로딩을 내부 측정 45초에서 8초로 줄이고 메모리 사용량을 40% 낮췄으며, Diagram 라이브러리와 커스텀 스프레드시트 엔진도 기획·개발·배포했습니다.",
    en: "At SBT Global, I worked as Frontend Engineer · AI Agent. I reduced AI LayoutEditor loading from 45 seconds to 8 seconds in internal measurements, lowered memory usage by 40%, and planned, built, and shipped a diagram library and a custom spreadsheet engine for design review work.",
  },
  infoin: {
    ko: "저는 Infoin에서 Frontend Engineer로 3D 디지털 트윈, 메타버스, 물류 손익 시뮬레이션, 포토 키오스크 제품의 프론트엔드를 개발했습니다. 3D 로딩을 35초에서 15초로 줄이고 메모리를 1.95GB에서 912MB로 낮췄습니다.",
    en: "At Infoin, I worked as a Frontend Engineer on 3D digital twin, metaverse, logistics simulation, and photo kiosk products. I reduced 3D loading from 35 seconds to 15 seconds and memory usage from 1.95GB to 912MB.",
  },
  jset: {
    ko: "저는 제이셋스태츠칩팩코리아(유)에서 QA ShiftLeader 책임으로 공정 불량 추적·통계 대시보드와 품질 이슈 알림을 개발했습니다.",
    en: "At JSET StatsChipPAC Korea Co., Ltd., I worked as a QA ShiftLeader and built a process defect tracking and statistics dashboard with quality issue notifications.",
  },
};

export function fallbackCompanyAnswer(company: GuideCompany, locale: GuideLocale): string {
  return companyFallbackAnswers[company][locale];
}

export function fallbackGuideAnswer(
  intent: GuideIntent,
  locale: GuideLocale = "ko",
  question = "",
  memory?: GuideConversationMemory,
): string {
  const targetRole = memory?.targetRole ?? "unknown";
  const covered = new Set(memory?.coveredEvidence ?? []);
  const askRole = targetRole === "unknown" && !memory?.roleAsked && (intent === "hiring" || intent === "general");
  const roleQuestion = locale === "en" ? "Is this closer to a Frontend, AI Agent, or hybrid role?" : "프론트엔드, AI Agent, 두 영역을 함께 보는 포지션 중 어디에 가깝나요?";
  const namedCompany = detectNamedCompany(question);
  if (namedCompany && (intent === "career" || intent === "frontend" || intent === "agent" || intent === "projects")) {
    return fallbackCompanyAnswer(namedCompany, locale);
  }
  if (intent === "projects") {
    if (targetRole === "frontend") return locale === "en" ? "I count AI LayoutEditor and a 3D digital twin among my representative Frontend projects. I reduced LayoutEditor loading from 45 seconds to 8 seconds in internal measurements, and reduced the 3D product's loading from 35 seconds to 15 seconds." : "저는 AI LayoutEditor와 3D 디지털 트윈을 대표 프론트엔드 프로젝트로 꼽습니다. LayoutEditor 로딩은 내부 측정 45초에서 8초로, 3D 제품 로딩은 35초에서 15초로 줄였습니다.";
    if (targetRole === "agent") return locale === "en" ? "I count the 10-language Translation Agent, Hospital Consultation and Booking Agent, OpenStockAI, OpenDataLabs, and OpenAlarm among my representative AI Agent projects. The documented work spans product flows, routing contract tests, research-to-requirement conversion, and three-stage notifications." : "저는 10개 언어 번역 Agent, 병원 상담예약 Agent, OpenStockAI, OpenDataLabs, OpenAlarm을 대표 AI Agent 프로젝트로 꼽습니다. 제품 흐름 구축, routing 계약 테스트, 논문 기반 요구사항 변환, 3단계 알림 구현을 각각 확인할 수 있습니다.";
    return locale === "en" ? "Among my 19 builds, I count AI LayoutEditor, the 10-language Translation Agent, OpenStockAI, the Hospital Consultation and Booking Agent, OpenDataLabs, and OpenAlarm as representative projects. They show both measured Frontend improvement and AI Agent product verification." : "저는 19개 build 가운데 AI LayoutEditor, 10개 언어 번역 Agent, OpenStockAI, 병원 상담예약 Agent, OpenDataLabs, OpenAlarm을 대표 프로젝트로 꼽습니다. 측정 가능한 프론트엔드 개선과 AI Agent 제품 검증을 함께 보여줍니다.";
  }
  if (intent === "hiring" && isHiringConcernQuestion(question)) {
    if (locale === "en") return fallbackEnglishGuideAnswer(intent, question);
    return "저는 확인된 자료만으로 개인적 약점을 꾸며 답하지 않겠습니다. 제 이력은 Frontend와 AI Agent를 연결한 제품 개발에 근거가 있고, 지원 역할의 기대와 맞지 않는 지점은 면접에서 사례로 확인해야 합니다. 역할의 핵심 기대를 알려주시면 관련 경험과 확인이 필요한 부분을 나눠 답하겠습니다.";
  }
  if ((intent === "hiring" || intent === "general") && isIdentityQuestion(question)) {
    const base = locale === "en"
      ? "I'm Kim Dowon. I build and improve Frontend products and AI Agents with React, Next.js, and TypeScript across 5 years of experience."
      : "김도원은 바로 저입니다. 저는 React, Next.js, TypeScript 기반 프론트엔드와 AI Agent를 직접 구축하고 개선하는 5년 경력 개발자입니다.";
    const nextStep = locale === "en"
      ? "Would you like my career history, representative projects, or hiring strengths first?"
      : "경력, 대표 프로젝트, 채용 강점 중 무엇부터 보실까요?";
    return `${base} ${askRole ? roleQuestion : nextStep}`;
  }
  if (isQualityPrincipleQuestion(question) && !["agent", "openstock", "opendata", "openalarm"].includes(intent)) {
    return locale === "en"
      ? "I manage code quality with explicit completion criteria and regression tests. I turn user language into context, reproduction conditions, and completion criteria, and I solve problems by observing signals, narrowing the cause, applying a patch, and leaving regression tests. OpenStockAI's 300 representative queries and 175 routing contract tests apply the same discipline on the Agent side."
      : "저는 코드 품질을 명시적인 완료 기준과 회귀 테스트로 관리합니다. 사용자 표현은 맥락, 재현 조건, 완료 기준으로 바꾸고, 문제는 신호 관찰, 원인 범위 축소, patch, 회귀 테스트 순서로 해결합니다. OpenStockAI의 300개 대표 질의와 175개 routing 계약 테스트처럼 Agent 동작도 같은 방식으로 검증합니다.";
  }
  if (isPersonalityQuestion(question)) {
    return locale === "en"
      ? "Colleagues would describe me as a developer who turns vague requests into context, reproduction conditions, and completion criteria a team can execute on. I approach problems systematically — observe signals, narrow the cause, then close with a patch and regression tests — and I treat the interface and the Agent flow as one product experience."
      : "저는 모호한 요청도 맥락, 재현 조건, 완료 기준으로 정리해 팀이 바로 실행할 수 있게 만드는 개발자입니다. 문제는 신호를 관찰하고 원인 범위를 좁힌 뒤 patch와 회귀 테스트로 마무리하는 체계적인 성향이고, 화면과 Agent 흐름을 하나의 제품 경험으로 설계합니다.";
  }
  if (intent === "hiring" || intent === "general") {
    const stepSet = hiringStepSets[targetRole === "frontend" || targetRole === "agent" ? targetRole : "general"];
    const answer = (stepSet.steps.find((step) => step.anyOf.some((id) => !covered.has(id))) ?? stepSet.wrapUp)[locale];
    return askRole ? `${answer} ${roleQuestion}` : answer;
  }
  if (locale === "en") return fallbackEnglishGuideAnswer(intent, question);
  if (intent === "frontend") return "저는 React, Next.js, TypeScript로 제품 화면과 운영 도구를 만듭니다. AI LayoutEditor 로딩을 45초에서 8초로 줄이고 메모리를 40% 낮췄습니다. 3D 화면과 편집 도구 중 어느 사례를 더 보고 싶으신가요?";
  if (intent === "agent") return "저는 병원 전용 상담예약 AI Agent 챗봇을 0→1로 개발하고, 10개 언어 번역 Agent, Browser + Observer Agent, 사내 AX Agent Admin 플랫폼을 만들었습니다. OpenStockAI는 300개 대표 질의와 175개 routing 계약 테스트로 검증하고, OpenDataLabs는 8개 논문을 40개 요구사항과 40개 테스트로 전환했습니다. OpenAlarm에는 3단계 알림과 AI 일기 회고를 구현했습니다.";
  if (intent === "openstock") return "저는 OpenStockAI에서 전문 역할별 조사와 판단을 300개 대표 질의와 175개 routing 계약 테스트로 검증합니다. 구체적인 routing 구조와 테스트 기준은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "opendata") return "저는 OpenDataLabs에서 8개 논문을 40개 제품 요구사항과 40개 테스트로 바꿨습니다. 구체적인 변환 절차와 테스트 기준은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "openalarm" && /일기|회고/.test(question)) return "저는 OpenAlarm에 AI 일기 회고를 구현했습니다. 회고의 구체적인 동작 방식은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "openalarm") return "저는 OpenAlarm에 기상, 준비, 출발을 잇는 3단계 알림과 AI 일기 회고를 구현했습니다. 구체적인 Agent 구조와 사용 기술은 이 포트폴리오에 기록하지 않았습니다.";
  if (intent === "career") return "저는 현재 WiseAI의 AI Agent Pro · Frontend와 OpenDoorLabs의 Founder · AI Product Engineer 역할을 함께 맡고 있습니다. QA 현장 도구에서 시작해 3D 프론트엔드와 AI 제품 개발로 범위를 넓혔습니다. 현재 역할과 이전 회사 성과 중 어디부터 보시겠어요?";
  if (intent === "contact") return "저는 이메일과 전화로 연락을 받습니다. 저의 GitHub과 LinkedIn에서도 작업 기록을 확인할 수 있습니다.";
  if (intent === "greeting") return "안녕하세요! 저는 Frontend와 AI Agent를 연결한 제품을 만드는 김도원입니다. 채용 강점, 대표 프로젝트, 협업 방식 중 궁금한 것부터 물어봐 주세요.";
  if (intent === "out_of_scope") return "그 주제는 이 안내에서 다루지 않아요. 저는 Frontend와 AI Agent를 연결한 제품 경험을 검증된 근거로 설명드릴 수 있습니다. 채용 강점과 대표 프로젝트 중 무엇을 살펴보실까요?";
  return "저는 Frontend와 AI Agent를 직접 구축하고 개선합니다. 화면의 선택과 상태를 명확히 하고, Agent의 조회와 검증을 사용자의 업무 완료까지 연결합니다. 제품 성과와 일하는 방식 중 무엇이 궁금하신가요?";
}
