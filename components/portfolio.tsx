"use client";

import {
  ArrowUpRightIcon, BracketsCurlyIcon, BriefcaseIcon,
  CheckIcon, CopySimpleIcon, DownloadSimpleIcon, EnvelopeSimpleIcon, GitCommitIcon,
  GameControllerIcon, GithubLogoIcon, LinkedinLogoIcon, ListIcon, LockKeyOpenIcon, PhoneIcon,
  PulseIcon, SquaresFourIcon, TerminalWindowIcon, UserIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GuideAgent } from "@/components/guide-agent";
import { PracticeContent } from "@/components/practice-content";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CONTACT } from "@/lib/contact";

const navItems = [
  { href: "/", label: "Overview", icon: UserIcon },
  { href: "/work", label: "Projects", icon: SquaresFourIcon },
  { href: "/process", label: "Practice", icon: BracketsCurlyIcon },
  { href: "/career", label: "Career", icon: BriefcaseIcon },
  { href: "/play", label: "Play", icon: GameControllerIcon },
  { href: "/contact", label: "Contact", icon: EnvelopeSimpleIcon },
] as const;

const projects = [
  ["01", "AI AGENT", "2025", "AI Agent Pro", "병원 상담예약 Agent", "병원 정보, 상담원 연결, 예약 생성·조회·변경·취소를 한 대화로 연결"],
  ["02", "AI AGENT", "2025", "AI Agent Pro · 설계·개발", "10개 언어 실시간 번역 Agent", "10개 언어 번역 흐름을 직접 설계·개발하고, 중복 모델 호출을 제거해 처리 시간을 15초→7초로 단축"],
  ["03", "FRONTEND", "2025", "Frontend · Agent", "AX Agent Admin", "Agent 설정과 운영 상태를 한 화면에서 관리하는 사내 도구"],
  ["04", "AI AGENT", "2025", "AI Agent Developer", "Browser + Observer Agent", "브라우저 실행과 관찰 결과를 연결한 업무 자동화 흐름"],
  ["05", "FRONTEND", "2025", "Frontend Engineer", "Capacitor app", "웹 제품을 모바일 실행 환경에 맞춰 패키징하고 상태 흐름 정리"],
  ["06", "PRODUCT UI", "2025", "Frontend Engineer", "ROI Dashboard", "투입 비용과 운영 결과를 비교하는 의사결정 대시보드"],
  ["07", "AI PRODUCT", "2026", "Founder · AI Product Engineer", "OpenStockAI", "300개 대표 질의와 175개 routing 계약 테스트로 검증"],
  ["08", "R&D", "2026", "Founder · AI Product Engineer", "OpenDataLabs", "8개 논문을 40개 요구사항과 40개 테스트로 변환"],
  ["09", "AI PRODUCT", "2026", "Founder · AI Product Engineer", "OpenAlarm", "기상·준비·출발 3단계 알림과 AI 일기 회고"],
  ["10", "FRONTEND", "2025", "AI Agent · Frontend", "AI LayoutEditor", "내부 측정 45초에서 8초, 메모리 사용량 40% 감소"],
  ["11", "OPEN SOURCE", "2025", "Creator", "sweet-diagram", "복잡한 흐름을 그리는 npm 패키지 v0.4.7"],
  ["12", "FRONTEND", "2025", "Frontend Engineer", "Custom Spreadsheet", "업무 규칙과 편집 상태를 담은 기업용 스프레드시트"],
  ["13", "3D WEB", "2024", "Frontend Engineer", "INFORACTIVE 3D", "산업 데이터를 3D 화면에서 탐색하는 인터페이스"],
  ["14", "DIGITAL TWIN", "2024", "Frontend Engineer", "A350 Digital Twin", "고객사명을 비공개로 처리한 항공 제조 디지털 트윈"],
  ["15", "3D WEB", "2024", "Frontend Engineer", "Aviation Metaverse", "항공 제조 공간과 정보를 연결한 3D 경험"],
  ["16", "SIMULATION", "2024", "Frontend Engineer", "Logistics Profit Simulation", "물류 조건별 손익을 비교하는 시뮬레이션 UI"],
  ["17", "DIGITAL TWIN", "2023", "Frontend Engineer", "BeyonD Digital Twin", "현장 설비와 운영 정보를 연결한 디지털 트윈"],
  ["18", "KIOSK", "2023", "Frontend Engineer", "Photo Kiosk", "현장 동선을 고려한 촬영·선택·출력 화면"],
  ["19", "QA SYSTEM", "2017", "QA ShiftLeader 책임", "Semiconductor QA Dashboard", "집계 자동화로 불량 추적 시간 70% 단축"],
] as const;

const heroFlowSteps = [
  { id: "request", index: "01", title: "다음 주 예약을 바꿔주세요", trace: "booking.change" },
  { id: "route", index: "02", title: "Frontend가 선택지를 정리", trace: "state.select" },
  { id: "agent", index: "03", title: "가능 시간 조회와 조건 확인", trace: "slot.lookup" },
  { id: "tool", index: "04", title: "예약 시스템에 변경 반영", trace: "booking.save" },
  { id: "result", index: "05", title: "10월 31일 14:30로 변경", trace: "completed" },
] as const;

function CommandNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const current = navItems.find((item) => item.href === pathname)?.label ?? "Overview";
  return (
    <nav className="command-nav" aria-label={t("주요 페이지")}>
      <Link href="/" className="command-brand" aria-label={t("처음으로")}><b>KD</b><span>Kim Dowon</span></Link>
      <Sheet>
        <SheetTrigger asChild><button className="command-jump" type="button"><ListIcon size={18} /><span>Navigate pages</span><b>{current}</b></button></SheetTrigger>
        <SheetContent title="Navigate pages">
          <div className="command-menu"><p>ROUTE INDEX</p>{navItems.map((item, index) => { const Icon = item.icon; return <SheetClose asChild key={item.href}><Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}><span>0{index + 1}</span><Icon size={19} /><strong>{item.label}</strong><ArrowUpRightIcon size={16} /></Link></SheetClose>; })}</div>
        </SheetContent>
      </Sheet>
      <div className="command-controls">
        <button
          className="command-jump command-locale"
          type="button"
          onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
          aria-label={t(locale === "ko" ? "언어를 영어로 전환" : "언어를 한국어로 전환")}
        >
          <b>{locale === "ko" ? "EN" : "한국어"}</b>
        </button>
        <Button asChild variant="secondary"><a href="/kim-dowon-portfolio.pdf" download title={locale === "en" ? t("PDF · 한국어 원본") : undefined} aria-label={locale === "en" ? t("PDF · 한국어 원본") : "PDF"}>{locale === "en" ? "PDF (KR)" : "PDF"} <DownloadSimpleIcon size={17} /></a></Button>
      </div>
    </nav>
  );
}

function ProductFlowDemo({ runVersion }: { runVersion: number }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const flowRef = useRef<HTMLElement>(null);
  const inView = useInView(flowRef, { amount: .3 });
  const [activeStep, setActiveStep] = useState(0);
  const [flowState, setFlowState] = useState<"READY" | "RUNNING" | "COMPLETED">("READY");
  useEffect(() => {
    if (!runVersion) return;
    const stepInterval = 900;
    const timers = heroFlowSteps.map((_, index) => window.setTimeout(() => {
      setActiveStep(index);
      setFlowState(index === heroFlowSteps.length - 1 ? "COMPLETED" : "RUNNING");
    }, reduced ? 0 : index * stepInterval));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduced, runVersion]);
  const visibleStep = reduced ? heroFlowSteps.length - 1 : activeStep;
  return <aside ref={flowRef} className="product-flow" aria-label={t("사용자 요청이 프론트엔드와 AI Agent를 거쳐 완료되는 제품 흐름")}>
    <div className="flow-trace" aria-hidden="true"><code>evt.request / booking.change / 09:42:18</code><code>state.transition / pending → ready</code><code>agent.tool / availability.lookup</code><code>result.commit / reservation.updated</code></div>
    <header className="flow-header"><span>LIVE PRODUCT FLOW</span><span className={`flow-live ${flowState === "RUNNING" ? "is-live" : ""}`}><i />{flowState}</span></header>
    <div className="flow-stage">
      <span className="flow-line" style={{ "--flow-progress": `${visibleStep * 25}%` } as React.CSSProperties} aria-hidden="true"><i className={inView && flowState === "RUNNING" ? "is-running" : ""} /></span>
      <div className="flow-nodes">{heroFlowSteps.map((step, index) => <motion.div className={`flow-node ${visibleStep === index ? "is-active" : ""}`} key={step.id} initial={reduced ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .7 }} transition={{ duration: .45, delay: index * .08, ease: [0.22, 1, 0.36, 1] }}><span>{step.index} / {step.id}</span><b>{t(step.title)}</b><code>{step.trace}</code><i aria-hidden="true" /></motion.div>)}</div>
    </div>
    <div className="flow-status"><span>TRACE <strong>{heroFlowSteps[visibleStep].id} / 05</strong></span><span>PRODUCT LAYER <strong>Frontend + AI Agent</strong></span><span>OUTPUT <strong>{flowState.toLowerCase()}</strong></span></div>
    <div className="agent-intro-strip" aria-label={t("김도원의 제품 개발 범위")}>
      <span><small>EXPERIENCE</small><strong>{t("5년")}</strong></span>
      <span><small>RANGE</small><strong>Frontend + AI Agent</strong></span>
      <span><small>OUTPUT</small><strong>19 builds</strong></span>
      <span><small>SIGNALS</small><strong>{t("제품 · 문제해결 · 협업")}</strong></span>
    </div>
  </aside>;
}

function HeroIntro({ onRun, hasRun }: { onRun: () => void; hasRun: boolean }) {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduced ? false as const : { opacity: 0, y: 9 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? .01 : .5, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  return <div className="hero-copy">
    <motion.span className="hero-system-label" {...enter(0)}>LIVE PRODUCT TRACE · KIM DOWON</motion.span>
    <motion.h1 {...enter(.05)}>{t("사용자의 말이,")}<br />{t("완료된 일로 바뀌는 제품.")}</motion.h1>
    <motion.p {...enter(.12)}>{t("예약 변경부터 10개 언어 번역, 전문 역할 협업까지.")} <br />{t("Frontend와 AI Agent를 한 제품 흐름으로 설계합니다.")}</motion.p>
    <motion.div className="hero-controls" {...enter(.2)}><div className="hero-actions"><Button type="button" onClick={onRun}>{t(hasRun ? "흐름 다시 실행" : "흐름 실행하기")} <PulseIcon size={17} /></Button><Button asChild variant="secondary"><Link href="/work">{t("프로젝트 로그 보기")} <ArrowUpRightIcon size={17} /></Link></Button></div><code className="build-command"><span aria-hidden="true">$</span> run request --trace booking.change</code></motion.div>
  </div>;
}

function SignalConsole() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const rows = [
    { label: "FRONTEND", status: "ready", title: "Event → State → UI", body: "예약 변경 이벤트를 명시적 상태 전환으로 바꾸고, 사용자가 다음 행동을 예측하는 화면에 연결합니다.", trace: ["event: slot.selected", "state: validating → ready", "ui: confirmation enabled"] },
    { label: "COMMUNICATION", status: "relay", title: "Voice → Context → Ticket → Check", body: "사용자의 표현에서 맥락과 재현 조건, 완료 기준을 뽑아 팀 티켓으로 옮기고 사용자 확인으로 닫습니다.", trace: ["voice: 시간이 그대로예요", "ticket: cache invalidation", "check: changed time visible"] },
    { label: "PROBLEM SOLVING", status: "locked", title: "Signal → Cause → Regression", body: "예약 조회 실패의 원인 후보를 세 개에서 하나로 좁히고 patch와 회귀 테스트를 함께 남깁니다.", trace: ["signal: HTTP 200 / empty", "cause: patient id mapping", "regression: 8 scenarios passed"] },
    { label: "CODE QUALITY", status: "stable", title: "Readable · Predictable · Cohesive · Decoupled", body: "읽어야 할 맥락을 줄이고, 이름과 동작을 맞추고, 함께 바뀌는 코드를 모으고, 변경이 번지는 경계를 좁힙니다.", trace: ["readability: local context", "cohesion: change together", "coupling: stable primitive"] },
  ];
  return <section id="signals" className="content-section signals-compact" aria-labelledby="signals-title"><div className="section-head"><p>WORKING SIGNALS</p><h2 id="signals-title">{t("화면과 시스템을")}<br />{t("같은 문제로 봅니다.")}</h2></div><div className="signal-console"><div className="signal-table" role="tablist" aria-label={t("작업 역량")}><div className="signal-table-head"><span>CHANNEL</span><span>STATE</span><span>DESCRIPTION</span></div>{rows.map((row, index) => <button key={row.label} type="button" role="tab" aria-selected={selected === index} onClick={() => setSelected(index)}><b>0{index + 1} · {row.label}</b><span>{row.status}</span><small>{row.title}</small></button>)}</div><motion.div className="signal-detail" key={rows[selected].label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .3 }} role="tabpanel"><span>ACTIVE DETAIL / {rows[selected].label}</span><h3>{rows[selected].title}</h3><p>{t(rows[selected].body)}</p><div>{rows[selected].trace.map((item) => <code key={item}>$ {t(item)}</code>)}</div></motion.div></div></section>;
}

function WiseDentalVisual() {
  const { t } = useLocale();
  return <div className="mini-product wise-mini"><div><span className="success-dot" /> {t("상담 진행 중")}</div><p>{t("“다음 주 예약도 가능할까요?”")}</p><p>{t("가능한 시간을 확인했어요. 예약 변경도 이어서 도와드릴게요.")}</p><footer><span>{t("AI 상담")}</span><span>{t("상담원 연결")}</span><span>{t("예약 생성")}</span></footer></div>;
}

function OpenStockVisual() {
  const { t } = useLocale();
  return <div className="mini-product stock-mini"><header><span>QUERY / ROUTING</span><b>{t("시장 진입 검토")}</b></header><div className="stock-roles">{["Research","Finance","Legal","Global","Patent","Tech","Strategy"].map((item, index) => <span key={item}><i>0{index + 1}</i>{item}<b>verified</b></span>)}</div><footer><span><b>300</b> {t("대표 질의")}</span><span><b>175</b> {t("routing 계약 테스트")}</span></footer></div>;
}

function OpenAlarmVisual() {
  const { t } = useLocale();
  return <div className="alarm-visual" aria-label={t("OpenAlarm의 기상, 준비, 출발 알림과 AI 일기 회고 흐름")}><header><span>OPENALARM / TODAY</span><b>07:10 → 08:20</b></header><div className="alarm-timeline">{[["07:10","기상","하루를 시작할 시간이에요"],["07:40","준비","필요한 준비를 확인했어요"],["08:20","출발","지금 출발하면 일정에 맞아요"]].map(([time,stage,copy],index)=><div key={stage}><time>{time}</time><i aria-hidden="true" /><span>0{index+1} / {t(stage)}</span><b>{t(copy)}</b></div>)}</div><aside><span>AI DIARY / REFLECTION</span><p>{t("오늘의 알림 흐름과 기록을 바탕으로 하루를 돌아봅니다.")}</p></aside></div>;
}

function TranslationVisual() {
  const { t } = useLocale();
  return <div className="translation-visual" aria-label={t("직접 설계하고 개발한 10개 언어 실시간 번역 Agent 흐름")}>
    <header><span>TRANSLATION FLOW</span><strong>10 LANGUAGES</strong></header>
    <div className="translation-flow">
      <div><small>01 · REQUEST</small><b>{t("번역 요청")}</b><code>source text</code></div>
      <i aria-hidden="true" />
      <div><small>02 · LANGUAGE ROUTE</small><b>{t("언어 분기 · 문맥 유지")}</b><code>1 model pass</code></div>
      <i aria-hidden="true" />
      <div><small>03 · RESULT</small><b>{t("번역 결과 반환")}</b><code>10 locales</code></div>
    </div>
    <footer><span>BEFORE <s>15s</s></span><strong>7s</strong><b>{t("약 53% 단축")}</b></footer>
  </div>;
}

function MetricRail() {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  return <div className="metric-rail" aria-label={t("주요 프로젝트 성과")}>{[["15s → 7s","translation"],["45s → 8s","layout loading"],["−40%","memory"],["300","queries"],["175","tests"]].map(([value,label],index) => <motion.div key={label} initial={{ opacity:0, y:reduced?0:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:.8 }} transition={{ delay:index*.08, duration:.38 }}><strong>{value}</strong><span>{label}</span></motion.div>)}</div>;
}

const buildLanes = [
  { label: "AI AGENT", count: 6, detail: "상담예약 · 번역 · Browser · OpenDoor 제품" },
  { label: "FRONTEND PRODUCT", count: 5, detail: "Admin · App · Dashboard · Editor · Spreadsheet" },
  { label: "3D / DIGITAL TWIN", count: 5, detail: "항공 · 물류 · 제조 시뮬레이션" },
  { label: "OPEN SOURCE", count: 1, detail: "sweet-diagram v0.4.7" },
  { label: "FIELD / QA UI", count: 2, detail: "Photo Kiosk · Semiconductor QA" },
] as const;

const activityFeed = [
  { scope: "translation.agent", value: "15s → 7s", state: "SHIPPED" },
  { scope: "layout.performance", value: "45s → 8s", state: "VERIFIED" },
  { scope: "routing.contracts", value: "175 passed", state: "LOCKED" },
  { scope: "user.voice", value: "context → done", state: "RELAYED" },
] as const;

function ContactSecret() {
  const { t } = useLocale();
  const [copied, setCopied] = useState<"email" | "phone" | null>(null);
  const copyValue = async (kind: "email" | "phone", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };
  return <section className="content-section contact-secret-section" aria-labelledby="contact-secret-title"><div className="contact-secret">
    <header><span id="contact-secret-title"><LockKeyOpenIcon size={16} /> CONTACT SECRET / PUBLIC CHANNELS</span><code>REVEALED</code></header>
    <div className="contact-secret-command">
      <code>$ reveal contact --public</code>
      <span>2 channels ready</span>
    </div>
    <div className="contact-secret-values">
      <div><span>EMAIL</span><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a><button type="button" onClick={() => copyValue("email", CONTACT.email)} aria-label={t("이메일 주소 복사")}>{copied === "email" ? <CheckIcon size={17} /> : <CopySimpleIcon size={17} />}<b>{copied === "email" ? "COPIED" : "COPY"}</b></button></div>
      <div><span>PHONE</span><a href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a><button type="button" onClick={() => copyValue("phone", CONTACT.phoneDisplay)} aria-label={t("전화번호 복사")}>{copied === "phone" ? <CheckIcon size={17} /> : <CopySimpleIcon size={17} />}<b>{copied === "phone" ? "COPIED" : "COPY"}</b></button></div>
    </div>
    <p className="sr-only" aria-live="polite">{copied ? `${t(copied === "email" ? "이메일 주소" : "전화번호")} COPIED` : ""}</p>
  </div></section>;
}

function WorldCupTeaser() {
  const { t } = useLocale();
  return <section className="content-section wc-teaser-section" aria-label={t("푸른곰 아케이드")}><Link className="wc-teaser" href="/play"><span>INTERMISSION / MINI GAMES</span><b>{t("잠깐 — 푸른곰 아케이드에서 쉬어가세요.")}</b><small>{t("이상형 월드컵, 벽돌깨기, 졸라맨 대전. 클리어하면 중요한 진실을 알게 됩니다.")}</small><GameControllerIcon size={22} /></Link></section>;
}

function HireActivity() {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const ledgerRows = [
    ["Frontend + AI Agent", "화면의 선택과 Agent의 실행을 한 backlog에서 설계", "번역 Agent 15s → 7s"],
    ["문제 진단", "신호를 보고 원인을 좁힌 뒤 회귀 테스트까지 작성", "LayoutEditor 45s → 8s · memory −40%"],
    ["소통", "사용자 표현을 맥락, 재현 조건, 완료 기준으로 정리", "OpenDataLabs 40 requirements · 40 tests"],
    ["제품 가치", "사용자의 다음 선택과 업무 완료 여부를 함께 확인", "OpenStockAI 300 queries · 175 tests"],
  ] as const;
  return <>
    <section id="build-activity" className="content-section activity-section" aria-labelledby="activity-title">
      <div className="section-head"><p>BUILD ACTIVITY</p><h2 id="activity-title">{t("5개 영역에서")}<br />{t("19개 제품을 만들었습니다.")}</h2><span>{t("포트폴리오에 기록한 19개 build를 실제 작업 영역으로 묶었습니다. 공개 저장소 활동은 GitHub에서 바로 확인할 수 있습니다.")}</span></div>
      <div className="build-activity-system">
        <div className="build-lanes"><header><TerminalWindowIcon size={17} /><span>5 LANES</span><strong>19 BUILDS</strong></header>{buildLanes.map((lane, index) => <div key={lane.label}><code>0{index + 1}</code><span><b>{lane.label}</b><small>{t(lane.detail)}</small></span><i><motion.em initial={reduced ? false : { scaleX:0 }} whileInView={{ scaleX:1 }} viewport={{ once:true, amount:.8 }} transition={{ duration:.55, delay:reduced?0:index*.08, ease:[.22,1,.36,1] }} style={{ "--lane-size": `${lane.count / 6 * 100}%` } as React.CSSProperties} /></i><strong>{lane.count}</strong></div>)}</div>
        <div className="activity-console">
          <header><span>SELECTED PRODUCT ACTIVITY</span><code>OUTPUT / PROOF</code></header>
          <div className="activity-console-intro"><GitCommitIcon size={18} /><p>{t("수치가 남은 작업만 골랐습니다. 각 결과는 프로젝트 설명과 같은 기준을 씁니다.")}</p></div>
          <div className="commit-feed">{activityFeed.map((item, index) => <motion.div key={item.scope} initial={reduced ? false : { opacity:0, x:10 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true, amount:.8 }} transition={{ duration:.32, delay:reduced?0:index*.07 }}><code>{item.scope}</code><strong>{item.value}</strong><span>{item.state}</span></motion.div>)}</div>
          <a className="activity-github" href={CONTACT.githubUrl} target="_blank" rel="noreferrer"><GithubLogoIcon size={18} /> GitHub / {CONTACT.githubHandle} <ArrowUpRightIcon size={16} /></a>
        </div>
      </div>
    </section>
    <section id="why-hire" className="content-section hire-section" aria-labelledby="hire-title">
      <div className="section-head"><p>WORKING AGREEMENT</p><h2 id="hire-title">{t("채용하면,")}<br />{t("이런 일을 잘합니다.")}</h2><span>{t("Frontend, AI Agent, 문제 진단, 팀 소통을 따로 넘기지 않아도 됩니다. 한 사람이 제품 흐름을 이어서 봅니다.")}</span></div>
      <div className="hire-ledger"><header><span>OUTPUT</span><span>PROOF</span><span>CASE</span></header>{ledgerRows.map(([output,proof,example],index)=><motion.div key={output} initial={reduced ? false : { opacity:.55, y:8 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:.8 }} transition={{ duration:.32, delay:reduced?0:index*.06 }}><code>0{index+1}</code><strong>{t(output)}</strong><p>{t(proof)}</p><span>{t(example)}</span></motion.div>)}</div>
    </section>
    <ContactSecret />
  </>;
}

function CareerMetricValue({ value }: { value: string }) {
  const [before, after] = value.split(" → ");
  if (!after) return <strong>{value}</strong>;
  return <strong className="career-metric-value"><span><small>BEFORE</small>{before}</span><i aria-hidden="true">→</i><span><small>AFTER</small>{after}</span></strong>;
}

function CareerCodeTrack() {
  const { t } = useLocale();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(4);
  const milestones = [
    { commit:"qa.init@2017", year:"2016–17", period:"2016.08 - 2017.11", label:"QA", company:"제이셋스태츠칩팩코리아(유)", role:"QA ShiftLeader 책임", copy:"공정 불량 추적과 통계 집계를 자동화하고 현장 품질 알림을 만들었습니다.", metrics:[["70%","tracking time reduction"]] },
    { commit:"frontend.ship@2023", year:"2023–24", period:"2023.04 - 2024.09", label:"Frontend", company:"Infoin", role:"Frontend Engineer", copy:"항공·물류·제조 데이터를 3D 디지털 트윈과 시뮬레이션 화면으로 옮겼습니다.", metrics:[["35s → 15s","loading"],["1.95GB → 912MB","memory"]] },
    { commit:"agent.build@2024", year:"2024–25", period:"2024.09 - 2025.10", label:"AI Agent", company:"SBT Global", role:"Frontend Engineer · AI Agent", copy:"Agent와 편집 도구, 다이어그램, 스프레드시트의 상태와 성능을 개선했습니다.", metrics:[["45s → 8s","loading"],["−40%","memory"],["100+","components"]] },
    { commit:"product.launch@2025", year:"2025–", period:"2025.10 - 현재", label:"Product", company:"WiseAI", role:"AI Agent Pro · Frontend", copy:"병원 상담예약 Agent와 10개 언어 실시간 번역 Agent, 운영 도구를 제품 흐름으로 연결했습니다.", metrics:[["15s → 7s","translation"],["10","languages"],["5","reservation flows"]] },
    { commit:"main@now", year:"NOW", period:"2026 - 현재", label:"Founder", company:"OpenDoorLabs", role:"Founder · AI Product Engineer", copy:"검증 가능한 전문 역할 협업형 AI 제품을 직접 설계하고 운영합니다.", metrics:[["300","queries"],["175","tests"],["8","papers"]] },
  ];
  const item = milestones[active];
  const records = milestones.map((mark, index) => ({ mark, index })).reverse();
  return <div className="career-code-track" aria-label={t("2016년 QA에서 현재 AI 제품 개발까지 이어지는 경력 commit log")}><header className="career-code-head"><code>$ git log --career --oneline</code><span>5 YEARS / CONTINUOUS DELIVERY</span></header><div className="commit-graph" style={{ "--commit-index": active } as React.CSSProperties}><span className="commit-base" aria-hidden="true" /><span className="commit-progress" aria-hidden="true" /><span className="commit-caret" aria-hidden="true">&gt;_</span>{milestones.map((mark, index) => <button type="button" className={`commit-node ${active === index ? "is-active" : ""}`} onClick={() => setActive(index)} key={mark.commit} aria-label={`${mark.commit} ${t(mark.company)} ${t("선택")}`} aria-pressed={active === index}><i /><code>{mark.commit}</code><span>{mark.year} · {t(mark.label)}</span></button>)}</div><div className="career-detail"><AnimatePresence initial={false} mode="popLayout"><motion.div layout className="career-detail-content" key={item.company} initial={reduced ? false : { opacity:.82, y:7 }} animate={{ opacity:1, y:0 }} exit={reduced ? { opacity:1, y:0 } : { opacity:.82, y:-7 }} transition={{ duration:reduced?.01:.34,ease:[.22,1,.36,1] }}><div className="career-summary"><span>CHECKOUT / {item.commit}</span><h3>{t(item.company)}</h3><b>{t(item.role)}</b><p>{t(item.copy)}</p></div><div className="career-metrics">{item.metrics.map(([value,label]) => <div key={label}><CareerMetricValue value={value} /><span>{label}</span></div>)}</div></motion.div></AnimatePresence></div><div className="career-records" aria-label={t("전체 경력 목록")}>{records.map(({ mark, index }) => <motion.article layout="position" transition={{ duration:reduced?.01:.3,ease:[.22,1,.36,1] }} className={active === index ? "is-active" : ""} key={mark.commit}><button type="button" onClick={() => setActive(index)} aria-pressed={active === index}><code>{active === index ? ">_ " : ""}{mark.commit}</code><strong>{t(mark.company)}</strong><span>{t(mark.period)} · {t(mark.role)}</span></button><p>{t(mark.copy)}</p><div>{mark.metrics.map(([value,label]) => <span key={label}><CareerMetricValue value={value} /><small>{label}</small></span>)}</div></motion.article>)}</div></div>;
}

export function Portfolio({ page = "home" }: { page?: "home" | "work" | "process" | "career" | "contact" }) {
  const { t } = useLocale();
  const [flowRun, setFlowRun] = useState(0);
  return <main id="main">
    {page === "home" && <><section id="intro" className="hero-section"><HeroIntro hasRun={flowRun > 0} onRun={() => setFlowRun((value) => value + 1)} /><ProductFlowDemo runVersion={flowRun} /></section><SignalConsole /><HireActivity /><WorldCupTeaser /><GuideAgent /></>}
    {page === "work" && <section id="work" className="content-section work-section"><div className="section-head"><p>SELECTED WORK</p><h2>{t("업무의 복잡함을")}<br />{t("작동하는 제품으로")}</h2><span>{t("AI Agent와 프론트엔드를 분리하지 않고 사용자가 일을 끝내는 흐름으로 설계합니다.")}</span></div><MetricRail /><div className="featured-work">
      <article className="feature-case primary-case"><div className="feature-copy"><small>01 / WISE DENTAL</small><h3>{t("상담에서 예약까지")}<br />{t("문맥을 이어갑니다.")}</h3><p>{t("병원 정보, AI 상담, 상담원 연결과 예약 생성·조회·변경·취소를 한 대화 안에서 처리합니다.")}</p><a href="https://wisedental.aiu-aipage.co.kr/" target="_blank" rel="noreferrer">{t("서비스 보기")} <ArrowUpRightIcon size={16} /></a></div><WiseDentalVisual /></article>
      <article className="feature-case translation-case"><div className="feature-copy"><small>02 / TRANSLATION AGENT</small><h3>{t("10개 언어 실시간 번역 Agent를")}<br />{t("직접 설계하고 개발했습니다.")}</h3><p>{t("번역 요청부터 언어 분기, 문맥 유지, 결과 반환까지 전체 흐름을 설계·개발했습니다. 중복 모델 호출을 제거해 내부 측정 처리 시간을 15초에서 7초로 줄였습니다.")}</p><div className="fact-line"><span>10 languages</span><span>15s → 7s</span><span>{t("약 53% 단축")}</span></div></div><TranslationVisual /></article>
      <article className="feature-case primary-case"><div className="feature-copy"><small>03 / OPENSTOCKAI</small><h3>{t("전문 역할의 판단을")}<br />{t("검증 가능한 결과로")}</h3><p>{t("질문을 전문 역할별 조사와 판단으로 라우팅하고, 결과를 계약 테스트로 검증합니다.")}</p><div className="fact-line"><span>{t("300 대표 질의")}</span><span>{t("175 routing 계약 테스트")}</span></div><a href="https://opendoor.supply/ko" target="_blank" rel="noreferrer">{t("플랫폼 보기")} <ArrowUpRightIcon size={16} /></a></div><OpenStockVisual /></article>
      <article className="feature-case alarm-case"><div className="feature-copy"><small>04 / OPENALARM</small><h3>{t("하루의 타이밍을")}<br />{t("세 단계로 나눕니다.")}</h3><p>{t("기상, 준비, 출발 알림을 순서대로 연결하고 하루가 끝나면 AI 일기 회고로 기록을 남깁니다.")}</p><div className="fact-line"><span>3-stage notification</span><span>AI diary reflection</span></div></div><OpenAlarmVisual /></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>05 / AX · BROWSER AGENT</small><h3>{t("Agent를 운영하는 화면")}</h3><p>{t("관리자가 설정과 상태를 읽는 AX Admin, 브라우저 실행과 결과 관찰을 잇는 Browser + Observer Agent를 개발했습니다.")}</p></div><div className="ascii-pane"><code>browser.run()</code><code>observer.capture()</code><code>agent.decide()</code><code>admin.review()</code></div></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>06 / LAYOUT · DIGITAL TWIN</small><h3>{t("무거운 편집과 3D 정보를 빠르게")}</h3><p>{t("LayoutEditor는 내부 측정 45초에서 8초, 메모리 40% 감소를 기록했습니다. 항공·물류·제조 데이터를 3D 화면과 시뮬레이션으로 구현했습니다.")}</p></div><div className="layout-pane"><span>100+ components</span><b>45s → 8s</b><small>internal project measurement</small></div></article>
    </div><div className="project-stream"><header><div><span>PROJECT STREAM</span><strong>19 BUILDS</strong></div><p>category / year / role / result</p></header><div className="project-table-head"><span>NO · CATEGORY</span><span>YEAR · ROLE</span><span>BUILD</span><span>RESULT</span></div>{projects.map(([no, category, year, role, name, result]) => <article key={no}><span>{no} · {category}</span><span>{year} · {t(role)}</span><strong>{t(name)}</strong><p>{t(result)}</p></article>)}</div></section>}
    {page === "process" && <PracticeContent />}
    {page === "career" && <section id="career" className="content-section career-section"><div className="section-head"><p>CAREER</p><h2>{t("현장 품질에서")}<br />{t("AI 제품까지")}</h2></div><CareerCodeTrack /></section>}
    {page === "contact" && <section id="contact" className="content-section contact-section"><div className="contact-copy"><p>CONTACT</p><h2>{t("풀고 싶은 문제가 있다면")}<br />{t("제품의 언어로 이야기해요.")}</h2><span>{t("AI Agent 구축부터 프론트엔드 제품 개발까지. 사용자에게 필요한 결과부터 함께 정의하겠습니다.")}</span></div><div className="contact-list"><a href={`mailto:${CONTACT.email}`}><EnvelopeSimpleIcon size={20} /><span>Email</span><strong>{CONTACT.email}</strong></a><a href={CONTACT.phoneHref}><PhoneIcon size={20} /><span>Phone</span><strong>{CONTACT.phoneDisplay}</strong></a><a href={CONTACT.githubUrl} target="_blank" rel="noreferrer"><GithubLogoIcon size={20} /><span>GitHub</span><strong>{CONTACT.githubHandle}</strong></a><a href={CONTACT.linkedinUrl} target="_blank" rel="noreferrer"><LinkedinLogoIcon size={20} /><span>LinkedIn</span><strong>{CONTACT.linkedinHandle}</strong></a></div></section>}
  </main>;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return <><a href="#main" className="skip-link">{t("본문으로 건너뛰기")}</a><CommandNav />{children}<footer className="site-footer"><span>© 2026 Kim Dowon</span><span>Seoul · Frontend Engineering ↔ AI Agent ↔ Product</span><Link href="/legal">Privacy · Terms</Link></footer></>;
}
