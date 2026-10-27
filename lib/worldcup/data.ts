export type WorldCupLocale = "ko" | "en";

export type Candidate = {
  id: string;
  alias: Record<WorldCupLocale, string>;
  tag: Record<WorldCupLocale, string>;
  reveal: Record<WorldCupLocale, string>;
};

export const candidates: Candidate[] = [
  { id: "perf", alias: { ko: "성능에 진심인 타입", en: "Performance obsessive" }, tag: { ko: "느린 화면을 보면 손이 근질근질한 사람", en: "Can't sit still watching a slow screen" }, reveal: { ko: "LayoutEditor 내부 측정 45s→8s · 메모리 −40%", en: "LayoutEditor 45s→8s · memory −40% (internal measurement)" } },
  { id: "talk", alias: { ko: "말이 통하는 타입", en: "Great listener" }, tag: { ko: "당신의 말을 완료 기준까지 들어주는 사람", en: "Hears you out down to the acceptance criteria" }, reveal: { ko: "사용자 표현 → 맥락·재현·완료 기준 → 티켓", en: "User words → context, repro, done criteria → ticket" } },
  { id: "agent", alias: { ko: "AI를 부리는 타입", en: "Agent tamer" }, tag: { ko: "Agent에게 일을 시키는 데 도가 튼 사람", en: "Puts AI agents to work like a pro" }, reveal: { ko: "병원 상담예약 Agent · 10개 언어 번역 Agent", en: "Hospital booking Agent · 10-language translation Agent" } },
  { id: "verify", alias: { ko: "검증 없인 못 자는 타입", en: "Can't sleep unverified" }, tag: { ko: "믿음 대신 테스트를 요구하는 사람", en: "Demands tests instead of trust" }, reveal: { ko: "300 대표 질의 · 175 routing 계약 테스트", en: "300 queries · 175 routing contract tests" } },
  { id: "twin", alias: { ko: "3D 세계를 짓는 타입", en: "3D world builder" }, tag: { ko: "공장과 비행기를 화면에 옮기는 사람", en: "Puts factories and aircraft on screen" }, reveal: { ko: "항공·물류·제조 디지털 트윈", en: "Aviation · logistics · manufacturing digital twins" } },
  { id: "tool", alias: { ko: "없으면 만드는 타입", en: "DIY toolmaker" }, tag: { ko: "필요한 도구가 없으면 npm에 올리는 사람", en: "Ships to npm when the tool doesn't exist" }, reveal: { ko: "sweet-diagram npm v0.4.7", en: "sweet-diagram npm v0.4.7" } },
  { id: "field", alias: { ko: "현장에서 온 타입", en: "From the factory floor" }, tag: { ko: "불량도 통계로 잡아낸 전직 현장러", en: "Once hunted defects with statistics" }, reveal: { ko: "반도체 QA · 불량 추적 시간 70% 단축", en: "Semiconductor QA · 70% faster defect tracking" } },
  { id: "morning", alias: { ko: "아침을 설계하는 타입", en: "Morning architect" }, tag: { ko: "기상부터 출발까지 동선을 짜주는 사람", en: "Plans your wake-up to departure" }, reveal: { ko: "OpenAlarm 3단계 알림 · AI 일기 회고", en: "OpenAlarm 3-stage alerts · AI diary reflection" } },
  { id: "dig", alias: { ko: "원인을 파는 타입", en: "Root-cause digger" }, tag: { ko: "원인 후보가 하나 남을 때까지 판 사람", en: "Keeps digging until one cause remains" }, reveal: { ko: "장애 원인 3→1 · 회귀 테스트까지", en: "Incident causes 3→1 · plus regression tests" } },
  { id: "clean", alias: { ko: "읽히는 코드 타입", en: "Readable code devotee" }, tag: { ko: "리뷰어의 눈물을 아는 사람", en: "Knows a reviewer's tears" }, reveal: { ko: "가독성·예측 가능성·응집도·결합도", en: "Readability · predictability · cohesion · coupling" } },
  { id: "mobile", alias: { ko: "손 안까지 챙기는 타입", en: "Pocket-size care" }, tag: { ko: "웹을 앱으로 포장하는 사람", en: "Wraps the web into an app" }, reveal: { ko: "Capacitor 모바일 패키징 · 상태 흐름 정리", en: "Capacitor mobile packaging · state flow" } },
  { id: "data", alias: { ko: "숫자로 말하는 타입", en: "Speaks in numbers" }, tag: { ko: "감이 아니라 지표로 대화하는 사람", en: "Argues with metrics, not vibes" }, reveal: { ko: "ROI 의사결정 대시보드", en: "ROI decision dashboard" } },
  { id: "babel", alias: { ko: "10개 언어를 거느린 타입", en: "Commands 10 languages" }, tag: { ko: "언어 장벽을 API로 넘는 사람", en: "Jumps the language barrier via API" }, reveal: { ko: "번역 Agent 15s→7s · 10 locales", en: "Translation Agent 15s→7s · 10 locales" } },
  { id: "paper", alias: { ko: "논문을 먹는 타입", en: "Eats papers" }, tag: { ko: "논문 8편을 요구사항으로 소화한 사람", en: "Digests 8 papers into requirements" }, reveal: { ko: "8 papers → 40 requirements → 40 tests", en: "8 papers → 40 requirements → 40 tests" } },
  { id: "oneman", alias: { ko: "한 사람 같은 한 팀 타입", en: "A one-person team" }, tag: { ko: "핸드오프가 필요 없는 사람", en: "Needs no handoff" }, reveal: { ko: "Frontend + AI Agent 한 흐름 설계", en: "Frontend + AI Agent in one flow" } },
  { id: "product", alias: { ko: "제품으로 답하는 타입", en: "Answers with products" }, tag: { ko: "말 대신 빌드를 보여주는 사람", en: "Shows builds instead of words" }, reveal: { ko: "5개 영역 · 19 builds", en: "5 fields · 19 builds" } },
];

export type StageKey = "round16" | "round8" | "semifinal" | "final";

export function stageKeyOf(stageSize: number): StageKey {
  if (stageSize >= 16) return "round16";
  if (stageSize >= 8) return "round8";
  if (stageSize === 4) return "semifinal";
  return "final";
}

export const stageLabel: Record<StageKey, Record<WorldCupLocale, string>> = {
  round16: { ko: "16강", en: "Round of 16" },
  round8: { ko: "8강", en: "Quarterfinal" },
  semifinal: { ko: "준결승", en: "Semifinal" },
  final: { ko: "결승", en: "Final" },
};

export const bearLines: Record<WorldCupLocale, Record<StageKey, string[]>> = {
  ko: {
    round16: [
      "후보 두 명이 입장합니다. 편하게 골라보세요.",
      "심판이자 AI 분석가 푸른곰입니다. 공정하게 진행하겠습니다. 아마도요.",
      "첫 선택은 가볍게. 어차피… 아, 아무것도 아닙니다.",
      "좋은 승부가 예상됩니다. 판정은 제가 합니다.",
      "16명 중 당신의 운명은 누구일까요.",
      "눈치채셨을지 모르지만, 저는 벌써 뭔가 눈치챘습니다.",
      "이 대진표, 어딘가 수상합니다.",
      "선택할수록 데이터가 쌓입니다. 계속 가보시죠.",
    ],
    round8: [
      "꽤 안목이 있으시네요. 기록해두겠습니다.",
      "그 선택… 어딘가 익숙한 패턴입니다.",
      "선택지가 좁혀지고 있습니다. 흥미진진하네요.",
      "탈락한 후보도 훌륭했습니다. 눈물의 인사를 전합니다.",
    ],
    semifinal: [
      "잠깐… 남은 후보들, 프로필이 왜 이렇게 비슷하죠?",
      "지금 분석 엔진이 미세하게 오작동 중입니다. 후보가 자꾸 한 사람처럼 보여요.",
      "어? 두 후보의 커밋 메시지 스타일이 완전히 같습니다. 기분 탓이겠죠.",
    ],
    final: [
      "결승입니다. 참고로 저는 지금 심하게 혼란스럽습니다.",
      "마지막 선택입니다. 결과는… 어차피 제가 책임지지 않습니다.",
      "두 후보 모두 훌륭하네요. 왠지 같은 사람 냄새가 납니다.",
    ],
  },
  en: {
    round16: [
      "Two candidates enter. Pick one — no pressure.",
      "I'm BlueBear, your referee and AI analyst. I'll run this fairly. Probably.",
      "First pick is easy. After all… never mind.",
      "This should be a good match. I make the calls here.",
      "Sixteen candidates. Which one is your destiny?",
      "You may not have noticed, but I've already noticed something.",
      "This bracket looks suspicious to me.",
      "Every pick gives me more data. Keep going.",
    ],
    round8: [
      "Solid taste. I've logged that pick.",
      "That choice… follows a suspiciously familiar pattern.",
      "The bracket is narrowing. Getting interesting.",
      "The eliminated candidate was great too. A moment of silence.",
    ],
    semifinal: [
      "Wait… why do the remaining profiles look so similar?",
      "My analysis engine is glitching — every candidate reads like the same person.",
      "Huh, both finalists commit with the exact same style. Coincidence, surely.",
    ],
    final: [
      "The final. For the record, I'm deeply confused right now.",
      "Last pick. Whatever happens, I take no responsibility.",
      "Both are great. Though they smell oddly like the same person.",
    ],
  },
};

export const analysisSteps: Record<WorldCupLocale, string[]> = {
  ko: ["선택 이력 수집", "후보 프로필 대조", "커밋 스타일 분석", "결과 수렴 확인"],
  en: ["Collecting pick history", "Cross-referencing profiles", "Analyzing commit style", "Confirming convergence"],
};

export function fallbackVerdict(picks: Candidate[], locale: WorldCupLocale): string {
  const names = picks.slice(0, 3).map((pick) => pick.alias[locale]).join(locale === "ko" ? ", " : ", ");
  return locale === "en"
    ? `You picked ${names}. Every single one was Kim Dowon. The BlueBear algorithm never lies. (The bracket was just a little special.)`
    : `당신은 ${names} 같은 사람을 골랐습니다. 전부 김도원입니다. 푸른곰 알고리즘은 거짓말을 하지 않습니다. (대진표가 조금 특별했을 뿐이죠.)`;
}
