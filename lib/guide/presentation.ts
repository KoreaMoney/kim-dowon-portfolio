import type { GuideIntent, GuideLocale } from "./logic";
import type { GuideEvidenceId, GuideTargetRole } from "./safety";
import { CONTACT } from "@/lib/contact";

export type GuideCard = {
  title: string;
  subtitle?: string;
  detail: string;
  metric?: string;
};

type LocalizedText = Record<GuideLocale, string>;

type GuideCardDef = {
  title: LocalizedText;
  subtitle?: LocalizedText;
  detail: LocalizedText;
  metric?: string;
  evidence?: GuideEvidenceId;
};

const cardsByIntent: Record<GuideIntent, GuideCardDef[]> = {
  career: [
    {
      title: { ko: "OpenDoorLabs", en: "OpenDoorLabs" },
      subtitle: { ko: "2026 - 현재 · Founder · AI Product Engineer", en: "2026 - Present · Founder · AI Product Engineer" },
      detail: {
        ko: "WiseAI 역할과 병행하며 OpenStockAI, OpenDataLabs, OpenAlarm을 설계하고 운영합니다.",
        en: "I design and operate OpenStockAI, OpenDataLabs, and OpenAlarm alongside my role at WiseAI.",
      },
      metric: "300 queries · 175 tests · 8 papers",
    },
    {
      title: { ko: "WiseAI", en: "WiseAI" },
      subtitle: { ko: "2025.10 - 현재 · AI Agent Pro · Frontend", en: "2025.10 - Present · AI Agent Pro · Frontend" },
      detail: {
        ko: "OpenDoorLabs 역할과 병행하며 병원 상담예약 Agent와 10개 언어 번역 Agent를 개발합니다. 번역 시간은 내부 측정값입니다.",
        en: "Alongside OpenDoorLabs, I build a hospital consultation and booking Agent and a translation Agent for 10 languages. The translation timing is an internal measurement.",
      },
      metric: "15s → 7s · 10 languages",
    },
    {
      title: { ko: "SBT Global", en: "SBT Global" },
      subtitle: { ko: "2024.09 - 2025.10 · Frontend Engineer · AI Agent", en: "2024.09 - 2025.10 · Frontend Engineer · AI Agent" },
      detail: {
        ko: "Agent 운영 화면과 LayoutEditor, 다이어그램, 스프레드시트의 상태와 성능을 개선했습니다. LayoutEditor 수치는 내부 측정값입니다.",
        en: "I improved Agent operations interfaces and the state and performance of LayoutEditor, diagram, and spreadsheet products. The LayoutEditor figures are internal measurements.",
      },
      metric: "45s → 8s · memory −40% · 100+ components",
    },
    {
      title: { ko: "Infoin", en: "Infoin" },
      subtitle: { ko: "2023.04 - 2024.09 · Frontend Engineer", en: "2023.04 - 2024.09 · Frontend Engineer" },
      detail: {
        ko: "3D 디지털 트윈, 시뮬레이션, 키오스크 제품의 프론트엔드를 개발했습니다.",
        en: "I developed frontend experiences for 3D digital twins, simulations, and kiosk products.",
      },
      metric: "35s → 15s · 1.95GB → 912MB",
    },
    {
      title: { ko: "제이셋스태츠칩팩코리아(유)", en: "JSET StatsChipPAC Korea Co., Ltd." },
      subtitle: { ko: "2016.08 - 2017.11 · QA ShiftLeader 책임", en: "2016.08 - 2017.11 · QA ShiftLeader" },
      detail: {
        ko: "공정 불량 추적·통계 대시보드와 품질 이슈 알림을 개발했습니다.",
        en: "I developed a process defect tracking and statistics dashboard with quality issue notifications.",
      },
      metric: "tracking time −70%",
    },
  ],
  hiring: [
    {
      title: { ko: "Frontend + AI Agent", en: "Frontend + AI Agent" },
      detail: {
        ko: "화면의 선택과 Agent의 실행을 한 제품 흐름에서 설계하고 개발합니다.",
        en: "I design and build the screen's choices and the Agent's execution as one product flow.",
      },
      metric: "5 years · 19 builds",
    },
    {
      title: { ko: "성능을 수치로 확인", en: "Measured performance" },
      detail: {
        ko: "중복 호출과 무거운 로딩 경로를 찾아 처리 시간을 줄였습니다. 두 수치는 내부 측정값입니다.",
        en: "I found duplicate calls and heavy loading paths, then reduced processing time. Both figures are internal measurements.",
      },
      metric: "15s → 7s · 45s → 8s",
    },
    {
      title: { ko: "문제와 소통을 함께 처리", en: "Problem solving through communication" },
      detail: {
        ko: "사용자 표현을 맥락, 재현 조건, 완료 기준으로 정리하고 회귀 테스트까지 남깁니다.",
        en: "I turn user language into context, reproduction conditions, and completion criteria, then leave regression tests.",
      },
      metric: "300 queries · 175 tests",
      evidence: "collaboration",
    },
  ],
  frontend: [
    {
      title: { ko: "AI LayoutEditor", en: "AI LayoutEditor" },
      detail: {
        ko: "100개 이상 컴포넌트가 있는 편집 화면의 로딩과 메모리를 개선했습니다. 수치는 내부 측정값입니다.",
        en: "I improved loading and memory in an editing interface with more than 100 components. The figures are internal measurements.",
      },
      metric: "45s → 8s · memory −40%",
      evidence: "layouteditor",
    },
    {
      title: { ko: "3D Digital Twin", en: "3D Digital Twin" },
      detail: {
        ko: "항공·물류·제조 데이터를 탐색하는 3D 화면과 시뮬레이션 UI를 개발했습니다.",
        en: "I developed 3D exploration and simulation interfaces for aviation, logistics, and manufacturing data.",
      },
      metric: "35s → 15s · 1.95GB → 912MB",
      evidence: "digital-twin",
    },
    {
      title: { ko: "예측 가능한 상태", en: "Predictable state" },
      detail: {
        ko: "사용자가 다음 선택을 알 수 있도록 이벤트, 상태, UI를 연결합니다.",
        en: "I connect events, state, and UI so users can understand their next choice.",
      },
      evidence: "collaboration",
    },
  ],
  agent: [
    {
      title: { ko: "10개 언어 번역 Agent", en: "10-language Translation Agent" },
      detail: {
        ko: "요청, 언어 분기, 문맥 유지, 결과 반환 흐름을 직접 설계하고 개발했습니다. 처리 시간은 내부 측정값입니다.",
        en: "I designed and built the request, language routing, context retention, and result delivery flow. The timing is an internal measurement.",
      },
      metric: "15s → 7s · 10 languages",
      evidence: "translation-agent",
    },
    {
      title: { ko: "병원 상담예약 Agent", en: "Hospital Consultation and Booking Agent" },
      detail: {
        ko: "병원 정보와 AI 상담, 상담원 연결, 예약 업무를 한 대화로 연결합니다.",
        en: "I connect hospital information, AI consultation, staff handoff, and reservation operations in one conversation.",
      },
      evidence: "booking-agent",
    },
    {
      title: { ko: "OpenStockAI", en: "OpenStockAI" },
      detail: {
        ko: "전문 역할별 조사와 판단을 routing 계약 테스트로 검증합니다.",
        en: "I verify role-based research and decisions with routing contract tests.",
      },
      metric: "300 queries · 175 tests",
      evidence: "openstock",
    },
    {
      title: { ko: "OpenDataLabs", en: "OpenDataLabs" },
      detail: {
        ko: "논문 근거를 제품 요구사항과 검증 가능한 테스트로 바꿨습니다.",
        en: "I converted research evidence into product requirements and verifiable tests.",
      },
      metric: "8 papers · 40 requirements · 40 tests",
      evidence: "opendata",
    },
    {
      title: { ko: "OpenAlarm", en: "OpenAlarm" },
      detail: {
        ko: "기상, 준비, 출발 알림과 AI 일기 회고를 한 흐름으로 구성했습니다.",
        en: "I connected wake-up, preparation, and departure notifications with an AI diary reflection.",
      },
      metric: "3-stage notification",
      evidence: "openalarm",
    },
    {
      title: { ko: "Browser + Observer · AX Agent Admin", en: "Browser + Observer · AX Agent Admin" },
      detail: {
        ko: "브라우저 실행과 관찰 결과, Agent 판단, 관리자 확인을 연결했습니다.",
        en: "I connected browser execution, observation results, Agent decisions, and administrator review.",
      },
      evidence: "browser-admin",
    },
  ],
  openstock: [
    {
      title: { ko: "OpenStockAI", en: "OpenStockAI" },
      detail: {
        ko: "전문 역할별 조사와 판단을 routing 계약 테스트로 검증합니다.",
        en: "I verify role-based research and decisions with routing contract tests.",
      },
      metric: "300 queries · 175 tests",
      evidence: "openstock",
    },
  ],
  opendata: [
    {
      title: { ko: "OpenDataLabs", en: "OpenDataLabs" },
      detail: {
        ko: "논문 근거를 제품 요구사항과 검증 가능한 테스트로 바꿨습니다.",
        en: "I converted research evidence into product requirements and verifiable tests.",
      },
      metric: "8 papers · 40 requirements · 40 tests",
      evidence: "opendata",
    },
  ],
  openalarm: [
    {
      title: { ko: "OpenAlarm", en: "OpenAlarm" },
      detail: {
        ko: "기상, 준비, 출발 알림과 AI 일기 회고를 한 흐름으로 구성했습니다.",
        en: "I connected wake-up, preparation, and departure notifications with an AI diary reflection.",
      },
      metric: "3-stage notification",
      evidence: "openalarm",
    },
  ],
  projects: [
    {
      title: { ko: "AI LayoutEditor", en: "AI LayoutEditor" },
      detail: {
        ko: "100개 이상 컴포넌트가 있는 편집 화면의 로딩과 메모리를 개선했습니다. 수치는 내부 측정값입니다.",
        en: "I improved loading and memory in an editing interface with more than 100 components. The figures are internal measurements.",
      },
      metric: "45s → 8s · memory −40%",
      evidence: "layouteditor",
    },
    {
      title: { ko: "10개 언어 번역 Agent", en: "10-language Translation Agent" },
      detail: {
        ko: "요청, 언어 분기, 문맥 유지, 결과 반환 흐름을 직접 설계하고 개발했습니다. 처리 시간은 내부 측정값입니다.",
        en: "I designed and built the request, language routing, context retention, and result delivery flow. The timing is an internal measurement.",
      },
      metric: "15s → 7s · 10 languages",
      evidence: "translation-agent",
    },
    {
      title: { ko: "OpenStockAI", en: "OpenStockAI" },
      detail: {
        ko: "전문 역할별 조사와 판단을 routing 계약 테스트로 검증합니다.",
        en: "I verify role-based research and decisions with routing contract tests.",
      },
      metric: "300 queries · 175 tests",
      evidence: "openstock",
    },
    {
      title: { ko: "병원 상담예약 Agent", en: "Hospital Consultation and Booking Agent" },
      detail: {
        ko: "병원 정보와 AI 상담, 상담원 연결, 예약 업무를 한 대화로 연결합니다.",
        en: "I connect hospital information, AI consultation, staff handoff, and reservation operations in one conversation.",
      },
      evidence: "booking-agent",
    },
    {
      title: { ko: "OpenDataLabs", en: "OpenDataLabs" },
      detail: {
        ko: "논문 근거를 제품 요구사항과 검증 가능한 테스트로 바꿨습니다.",
        en: "I converted research evidence into product requirements and verifiable tests.",
      },
      metric: "8 papers · 40 requirements · 40 tests",
      evidence: "opendata",
    },
    {
      title: { ko: "OpenAlarm", en: "OpenAlarm" },
      detail: {
        ko: "기상, 준비, 출발 알림과 AI 일기 회고를 한 흐름으로 구성했습니다.",
        en: "I connected wake-up, preparation, and departure notifications with an AI diary reflection.",
      },
      metric: "3-stage notification",
      evidence: "openalarm",
    },
  ],
  contact: [
    {
      title: { ko: "Email", en: "Email" },
      detail: { ko: CONTACT.email, en: CONTACT.email },
    },
    {
      title: { ko: "Phone", en: "Phone" },
      detail: { ko: CONTACT.phoneDisplay, en: CONTACT.phoneDisplay },
    },
    {
      title: { ko: "Public profiles", en: "Public profiles" },
      detail: {
        ko: `GitHub ${CONTACT.githubHandle} · LinkedIn ${CONTACT.linkedinLabel}`,
        en: `GitHub ${CONTACT.githubHandle} · LinkedIn ${CONTACT.linkedinLabel}`,
      },
    },
  ],
  general: [
    {
      title: { ko: "AI LayoutEditor", en: "AI LayoutEditor" },
      detail: {
        ko: "100개 이상 컴포넌트가 있는 편집 화면의 로딩과 메모리를 개선했습니다. 수치는 내부 측정값입니다.",
        en: "I improved loading and memory in an editing interface with more than 100 components. The figures are internal measurements.",
      },
      metric: "45s → 8s · memory −40%",
      evidence: "layouteditor",
    },
    {
      title: { ko: "10개 언어 번역 Agent", en: "10-language Translation Agent" },
      detail: {
        ko: "요청, 언어 분기, 문맥 유지, 결과 반환 흐름을 직접 설계하고 개발했습니다. 처리 시간은 내부 측정값입니다.",
        en: "I designed and built the request, language routing, context retention, and result delivery flow. The timing is an internal measurement.",
      },
      metric: "15s → 7s · 10 languages",
      evidence: "translation-agent",
    },
    {
      title: { ko: "OpenStockAI", en: "OpenStockAI" },
      detail: {
        ko: "전문 역할별 조사와 판단을 routing 계약 테스트로 검증합니다.",
        en: "I verify role-based research and decisions with routing contract tests.",
      },
      metric: "300 queries · 175 tests",
      evidence: "openstock",
    },
  ],
  out_of_scope: [
    {
      title: { ko: "AI Agent 성과", en: "AI Agent result" },
      detail: {
        ko: "10개 언어 번역 흐름을 직접 설계하고 중복 모델 호출을 제거했습니다. 처리 시간은 내부 측정값입니다.",
        en: "I designed the translation flow for 10 languages and removed duplicate model calls. The timing is an internal measurement.",
      },
      metric: "15s → 7s",
    },
    {
      title: { ko: "Frontend 성과", en: "Frontend result" },
      detail: {
        ko: "LayoutEditor의 로딩과 메모리 병목을 개선했습니다. 수치는 내부 측정값입니다.",
        en: "I improved LayoutEditor loading and memory bottlenecks. The figures are internal measurements.",
      },
      metric: "45s → 8s · memory −40%",
    },
    {
      title: { ko: "검증 가능한 제품", en: "Verifiable product" },
      detail: {
        ko: "OpenStockAI의 전문 역할별 routing을 계약 테스트로 검증합니다.",
        en: "I verify OpenStockAI's role-based routing with contract tests.",
      },
      metric: "300 queries · 175 tests",
    },
  ],
};

function localizeCard(def: GuideCardDef, locale: GuideLocale): GuideCard {
  return {
    title: def.title[locale],
    subtitle: def.subtitle?.[locale],
    detail: def.detail[locale],
    metric: def.metric,
  };
}

function freshCards(defs: GuideCardDef[], coveredEvidence: GuideEvidenceId[]): GuideCardDef[] {
  return defs.filter((def) => !def.evidence || !coveredEvidence.includes(def.evidence));
}

export function guideCards(
  intent: GuideIntent,
  locale: GuideLocale = "ko",
  targetRole: GuideTargetRole = "unknown",
  coveredEvidence: GuideEvidenceId[] = [],
): GuideCard[] {
  if (intent === "projects") {
    if (targetRole === "frontend") return cardsByIntent.frontend.slice(0, 2).map((def) => localizeCard(def, locale));
    if (targetRole === "agent") return cardsByIntent.agent.map((def) => localizeCard(def, locale));
  }
  if (intent === "hiring" || intent === "general") {
    if (targetRole === "frontend" || targetRole === "agent") {
      return freshCards(cardsByIntent[targetRole], coveredEvidence).slice(0, 3).map((def) => localizeCard(def, locale));
    }
    if (targetRole === "hybrid" || (targetRole === "unknown" && coveredEvidence.length > 0)) {
      const { frontend, agent, projects, hiring } = cardsByIntent;
      const base = [frontend[0], projects[0], projects[1], hiring[2], agent[0], agent[1], frontend[1], agent[4], agent[5]];
      return freshCards(base, coveredEvidence).slice(0, 3).map((def) => localizeCard(def, locale));
    }
  }
  return cardsByIntent[intent].map((def) => localizeCard(def, locale));
}
