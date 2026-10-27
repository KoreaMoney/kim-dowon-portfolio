"use client";

import {
  ArrowUpRightIcon, BracketsCurlyIcon, BriefcaseIcon,
  DownloadSimpleIcon, EnvelopeSimpleIcon, GithubLogoIcon, LinkedinLogoIcon,
  ListIcon, PhoneIcon, PulseIcon, SquaresFourIcon, UserIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Overview", icon: UserIcon },
  { href: "/work", label: "Projects", icon: SquaresFourIcon },
  { href: "/process", label: "Practice", icon: BracketsCurlyIcon },
  { href: "/career", label: "Career", icon: BriefcaseIcon },
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

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .14 }} transition={{ duration: reduced ? .15 : .6, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function CommandNav() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname)?.label ?? "Overview";
  return (
    <nav className="command-nav" aria-label="주요 페이지">
      <Link href="/" className="command-brand" aria-label="처음으로"><b>KD</b><span>Kim Dowon</span></Link>
      <Sheet>
        <SheetTrigger asChild><button className="command-jump" type="button"><ListIcon size={18} /><span>Navigate pages</span><b>{current}</b></button></SheetTrigger>
        <SheetContent title="Navigate pages">
          <div className="command-menu"><p>ROUTE INDEX</p>{navItems.map((item, index) => { const Icon = item.icon; return <SheetClose asChild key={item.href}><Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}><span>0{index + 1}</span><Icon size={19} /><strong>{item.label}</strong><ArrowUpRightIcon size={16} /></Link></SheetClose>; })}</div>
        </SheetContent>
      </Sheet>
      <Button asChild variant="secondary"><a href="/kim-dowon-portfolio.pdf" download>PDF <DownloadSimpleIcon size={17} /></a></Button>
    </nav>
  );
}

function ProductFlowDemo({ runVersion }: { runVersion: number }) {
  const reduced = useReducedMotion();
  const flowRef = useRef<HTMLElement>(null);
  const inView = useInView(flowRef, { amount: .3 });
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    if (reduced || !runVersion) return;
    const timers = heroFlowSteps.map((_, index) => window.setTimeout(() => setActiveStep(index), index * 170));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduced, runVersion]);
  const visibleStep = reduced ? heroFlowSteps.length - 1 : activeStep;
  const flowState = visibleStep === heroFlowSteps.length - 1 && (runVersion || reduced) ? "COMPLETED" : runVersion ? "RUNNING" : "READY";
  return <aside ref={flowRef} className="product-flow" aria-label="사용자 요청이 프론트엔드와 AI Agent를 거쳐 완료되는 제품 흐름">
    <div className="flow-trace" aria-hidden="true"><code>evt.request / booking.change / 09:42:18</code><code>state.transition / pending → ready</code><code>agent.tool / availability.lookup</code><code>result.commit / reservation.updated</code></div>
    <header className="flow-header"><span>LIVE PRODUCT FLOW</span><span className={`flow-live ${flowState === "RUNNING" ? "is-live" : ""}`}><i />{flowState}</span></header>
    <div className="flow-stage">
      <span className="flow-line" aria-hidden="true"><i className={inView && runVersion > 0 && !reduced && visibleStep < heroFlowSteps.length - 1 ? "is-running" : ""} /></span>
      <div className="flow-nodes">{heroFlowSteps.map((step, index) => <motion.div className={`flow-node ${visibleStep === index ? "is-active" : ""}`} key={step.id} initial={reduced ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .7 }} transition={{ duration: .45, delay: index * .08, ease: [0.22, 1, 0.36, 1] }}><span>{step.index} / {step.id}</span><b>{step.title}</b><code>{step.trace}</code><i aria-hidden="true" /></motion.div>)}</div>
    </div>
    <div className="flow-status"><span>TRACE <strong>request → result</strong></span><span>PRODUCT LAYER <strong>Frontend + AI Agent</strong></span><span>OUTPUT <strong>completed</strong></span></div>
  </aside>;
}

function HeroIntro({ onRun }: { onRun: () => void }) {
  const reduced = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduced ? false as const : { opacity: 0, y: 9 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? .01 : .5, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  return <div className="hero-copy">
    <motion.span className="hero-system-label" {...enter(0)}>LIVE PRODUCT TRACE · KIM DOWON</motion.span>
    <motion.h1 {...enter(.05)}>사용자의 말이,<br />완료된 일로 바뀌는 제품.</motion.h1>
    <motion.p {...enter(.12)}>예약 변경부터 10개 언어 번역, 전문 역할 협업까지. <br />Frontend와 AI Agent를 한 제품 흐름으로 설계합니다.</motion.p>
    <motion.div className="hero-controls" {...enter(.2)}><div className="hero-actions"><Button type="button" onClick={onRun}>흐름 실행하기 <PulseIcon size={17} /></Button><Button asChild variant="secondary"><Link href="/work">프로젝트 로그 보기 <ArrowUpRightIcon size={17} /></Link></Button></div><code className="build-command"><span aria-hidden="true">$</span> run request --trace booking.change</code></motion.div>
  </div>;
}

function SignalConsole() {
  const [selected, setSelected] = useState(0);
  const rows = [
    { label: "FRONTEND", status: "ready", title: "Event → State → UI", body: "예약 변경 이벤트를 명시적 상태 전환으로 바꾸고, 사용자가 다음 행동을 예측하는 화면에 연결합니다.", trace: ["event: slot.selected", "state: validating → ready", "ui: confirmation enabled"] },
    { label: "COMMUNICATION", status: "relay", title: "Voice → Context → Ticket → Check", body: "사용자의 표현에서 맥락과 재현 조건, 완료 기준을 뽑아 팀 티켓으로 옮기고 사용자 확인으로 닫습니다.", trace: ["voice: 시간이 그대로예요", "ticket: cache invalidation", "check: changed time visible"] },
    { label: "PROBLEM SOLVING", status: "locked", title: "Signal → Cause → Regression", body: "예약 조회 실패의 원인 후보를 세 개에서 하나로 좁히고 patch와 회귀 테스트를 함께 남깁니다.", trace: ["signal: HTTP 200 / empty", "cause: patient id mapping", "regression: 8 scenarios passed"] },
    { label: "CODE QUALITY", status: "stable", title: "Readable · Predictable · Cohesive · Decoupled", body: "읽어야 할 맥락을 줄이고, 이름과 동작을 맞추고, 함께 바뀌는 코드를 모으고, 변경이 번지는 경계를 좁힙니다.", trace: ["readability: local context", "cohesion: change together", "coupling: stable primitive"] },
  ];
  return <section id="signals" className="content-section signals-compact" aria-labelledby="signals-title"><div className="section-head"><p>WORKING SIGNALS</p><h2 id="signals-title">화면과 시스템을<br />같은 문제로 봅니다.</h2></div><div className="signal-console"><div className="signal-table" role="tablist" aria-label="작업 역량"><div className="signal-table-head"><span>CHANNEL</span><span>STATE</span><span>DESCRIPTION</span></div>{rows.map((row, index) => <button key={row.label} type="button" role="tab" aria-selected={selected === index} onClick={() => setSelected(index)}><b>0{index + 1} · {row.label}</b><span>{row.status}</span><small>{row.title}</small></button>)}</div><motion.div className="signal-detail" key={rows[selected].label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .3 }} role="tabpanel"><span>ACTIVE DETAIL / {rows[selected].label}</span><h3>{rows[selected].title}</h3><p>{rows[selected].body}</p><div>{rows[selected].trace.map((item) => <code key={item}>$ {item}</code>)}</div></motion.div></div></section>;
}

function WiseDentalVisual() { return <div className="mini-product wise-mini"><div><span className="success-dot" /> 상담 진행 중</div><p>“다음 주 예약도 가능할까요?”</p><p>가능한 시간을 확인했어요. 예약 변경도 이어서 도와드릴게요.</p><footer><span>AI 상담</span><span>상담원 연결</span><span>예약 생성</span></footer></div>; }
function OpenStockVisual() { return <div className="mini-product stock-mini"><header><span>QUERY / ROUTING</span><b>시장 진입 검토</b></header><div className="stock-roles">{["Research","Finance","Legal","Global","Patent","Tech","Strategy"].map((item, index) => <span key={item}><i>0{index + 1}</i>{item}<b>verified</b></span>)}</div><footer><span><b>300</b> 대표 질의</span><span><b>175</b> routing 계약 테스트</span></footer></div>; }
function OpenAlarmVisual() { return <div className="alarm-visual" aria-label="OpenAlarm의 기상, 준비, 출발 알림과 AI 일기 회고 흐름"><header><span>OPENALARM / TODAY</span><b>07:10 → 08:20</b></header><div className="alarm-timeline">{[["07:10","기상","하루를 시작할 시간이에요"],["07:40","준비","필요한 준비를 확인했어요"],["08:20","출발","지금 출발하면 일정에 맞아요"]].map(([time,stage,copy],index)=><div key={stage}><time>{time}</time><i aria-hidden="true" /><span>0{index+1} / {stage}</span><b>{copy}</b></div>)}</div><aside><span>AI DIARY / REFLECTION</span><p>오늘의 알림 흐름과 기록을 바탕으로 하루를 돌아봅니다.</p></aside></div>; }

function TranslationVisual() {
  return <div className="translation-visual" aria-label="직접 설계하고 개발한 10개 언어 실시간 번역 Agent 흐름">
    <header><span>TRANSLATION FLOW</span><strong>10 LANGUAGES</strong></header>
    <div className="translation-flow">
      <div><small>01 · REQUEST</small><b>번역 요청</b><code>source text</code></div>
      <i aria-hidden="true" />
      <div><small>02 · LANGUAGE ROUTE</small><b>언어 분기 · 문맥 유지</b><code>1 model pass</code></div>
      <i aria-hidden="true" />
      <div><small>03 · RESULT</small><b>번역 결과 반환</b><code>10 locales</code></div>
    </div>
    <footer><span>BEFORE <s>15s</s></span><strong>7s</strong><b>약 53% 단축</b></footer>
  </div>;
}

function MetricRail() {
  const reduced = useReducedMotion();
  return <div className="metric-rail" aria-label="주요 프로젝트 성과">{[["15s → 7s","translation"],["45s → 8s","layout loading"],["−40%","memory"],["300","queries"],["175","tests"]].map(([value,label],index) => <motion.div key={label} initial={{ opacity:0, y:reduced?0:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:.8 }} transition={{ delay:index*.08, duration:.38 }}><strong>{value}</strong><span>{label}</span></motion.div>)}</div>;
}

function CareerCodeTrack() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(4);
  const milestones = [
    { commit:"qa.init@2017", year:"2016–17", period:"2016.08 - 2017.11", label:"QA", company:"제이셋스태츠칩팩코리아(유)", role:"QA ShiftLeader 책임", copy:"공정 불량 추적과 통계 집계를 자동화하고 현장 품질 알림을 만들었습니다.", metrics:[["70%","tracking time reduction"]] },
    { commit:"frontend.ship@2023", year:"2023–24", period:"2023.04 - 2024.09", label:"Frontend", company:"Infoin", role:"Frontend Engineer", copy:"항공·물류·제조 데이터를 3D 디지털 트윈과 시뮬레이션 화면으로 옮겼습니다.", metrics:[["35s → 15s","loading"],["1.95GB → 912MB","memory"]] },
    { commit:"agent.build@2024", year:"2024–25", period:"2024.09 - 2025.10", label:"AI Agent", company:"SBT Global", role:"Frontend Engineer · AI Agent", copy:"Agent와 편집 도구, 다이어그램, 스프레드시트의 상태와 성능을 개선했습니다.", metrics:[["45s → 8s","loading"],["−40%","memory"],["100+","components"]] },
    { commit:"product.launch@2025", year:"2025–", period:"2025.10 - 현재", label:"Product", company:"WiseAI", role:"AI Agent Pro · Frontend", copy:"병원 상담예약 Agent와 10개 언어 실시간 번역 Agent, 운영 도구를 제품 흐름으로 연결했습니다.", metrics:[["15s → 7s","translation"],["10","languages"],["5","reservation flows"]] },
    { commit:"main@now", year:"NOW", period:"2026 - 현재", label:"Founder", company:"OpenDoorLabs", role:"Founder · AI Product Engineer", copy:"검증 가능한 전문 역할 협업형 AI 제품을 직접 설계하고 운영합니다.", metrics:[["300","queries"],["175","tests"],["8","papers"]] },
  ];
  const selectMilestone = (index: number) => {
    setActive(index);
  };
  const item = milestones[active];
  const records = milestones.map((mark, index) => ({ mark, index })).reverse();
  return <div className="career-code-track" aria-label="2016년 QA에서 현재 AI 제품 개발까지 이어지는 경력 commit log"><header className="career-code-head"><code>$ git log --career --oneline</code><span>5 YEARS / CONTINUOUS DELIVERY</span></header><div className="commit-graph" style={{ "--commit-index": active } as React.CSSProperties}><span className="commit-base" aria-hidden="true" /><span className="commit-progress" aria-hidden="true" /><span className="commit-caret" aria-hidden="true">&gt;_</span>{milestones.map((mark, index) => <button type="button" className={`commit-node ${active === index ? "is-active" : ""}`} onClick={() => selectMilestone(index)} key={mark.commit} aria-label={`${mark.commit} ${mark.company} 선택`} aria-pressed={active === index}><i /><code>{mark.commit}</code><span>{mark.year} · {mark.label}</span></button>)}</div><div className="career-detail"><AnimatePresence initial={false} mode="popLayout"><motion.div layout className="career-detail-content" key={item.company} initial={reduced ? false : { opacity:.82, y:7 }} animate={{ opacity:1, y:0 }} exit={reduced ? { opacity:1, y:0 } : { opacity:.82, y:-7 }} transition={{ duration:reduced?.01:.34,ease:[.22,1,.36,1] }}><div className="career-summary"><span>CHECKOUT / {item.commit}</span><h3>{item.company}</h3><b>{item.role}</b><p>{item.copy}</p></div><div className="career-metrics">{item.metrics.map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></motion.div></AnimatePresence></div><div className="career-records" aria-label="전체 경력 목록">{records.map(({ mark, index }) => <motion.article layout="position" transition={{ duration:reduced?.01:.3,ease:[.22,1,.36,1] }} className={active === index ? "is-active" : ""} key={mark.commit}><button type="button" onClick={() => selectMilestone(index)} aria-pressed={active === index}><code>{active === index ? ">_ " : ""}{mark.commit}</code><strong>{mark.company}</strong><span>{mark.period} · {mark.role}</span></button><p>{mark.copy}</p><div>{mark.metrics.map(([value,label]) => <span key={label}><strong>{value}</strong><small>{label}</small></span>)}</div></motion.article>)}</div></div>;
}

export function Portfolio({ page = "home" }: { page?: "home" | "work" | "process" | "career" | "contact" }) {
  const [flowRun, setFlowRun] = useState(0);
  return <main id="main">
    {page === "home" && <><section id="intro" className="hero-section"><HeroIntro onRun={() => setFlowRun((value) => value + 1)} /><ProductFlowDemo runVersion={flowRun} /></section><SignalConsole /></>}
    {page === "work" && <section id="work" className="content-section work-section"><div className="section-head"><p>SELECTED WORK</p><h2>업무의 복잡함을<br />작동하는 제품으로</h2><span>AI Agent와 프론트엔드를 분리하지 않고 사용자가 일을 끝내는 흐름으로 설계합니다.</span></div><MetricRail /><div className="featured-work">
      <article className="feature-case primary-case"><div className="feature-copy"><small>01 / WISE DENTAL</small><h3>상담에서 예약까지<br />문맥을 이어갑니다.</h3><p>병원 정보, AI 상담, 상담원 연결과 예약 생성·조회·변경·취소를 한 대화 안에서 처리합니다.</p><a href="https://wisedental.aiu-aipage.co.kr/" target="_blank" rel="noreferrer">서비스 보기 <ArrowUpRightIcon size={16} /></a></div><WiseDentalVisual /></article>
      <article className="feature-case translation-case"><div className="feature-copy"><small>02 / TRANSLATION AGENT</small><h3>10개 언어 실시간 번역 Agent를<br />직접 설계하고 개발했습니다.</h3><p>번역 요청부터 언어 분기, 문맥 유지, 결과 반환까지 전체 흐름을 설계·개발했습니다. 중복 모델 호출을 제거해 내부 측정 처리 시간을 15초에서 7초로 줄였습니다.</p><div className="fact-line"><span>10 languages</span><span>15s → 7s</span><span>약 53% 단축</span></div></div><TranslationVisual /></article>
      <article className="feature-case primary-case"><div className="feature-copy"><small>03 / OPENSTOCKAI</small><h3>전문 역할의 판단을<br />검증 가능한 결과로</h3><p>질문을 전문 역할별 조사와 판단으로 라우팅하고, 결과를 계약 테스트로 검증합니다.</p><div className="fact-line"><span>300 대표 질의</span><span>175 routing 계약 테스트</span></div><a href="https://opendoor.supply/ko" target="_blank" rel="noreferrer">플랫폼 보기 <ArrowUpRightIcon size={16} /></a></div><OpenStockVisual /></article>
      <article className="feature-case alarm-case"><div className="feature-copy"><small>04 / OPENALARM</small><h3>하루의 타이밍을<br />세 단계로 나눕니다.</h3><p>기상, 준비, 출발 알림을 순서대로 연결하고 하루가 끝나면 AI 일기 회고로 기록을 남깁니다.</p><div className="fact-line"><span>3-stage notification</span><span>AI diary reflection</span></div></div><OpenAlarmVisual /></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>05 / AX · BROWSER AGENT</small><h3>Agent를 운영하는 화면</h3><p>관리자가 설정과 상태를 읽는 AX Admin, 브라우저 실행과 결과 관찰을 잇는 Browser + Observer Agent를 개발했습니다.</p></div><div className="ascii-pane"><code>browser.run()</code><code>observer.capture()</code><code>agent.decide()</code><code>admin.review()</code></div></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>06 / LAYOUT · DIGITAL TWIN</small><h3>무거운 편집과 3D 정보를 빠르게</h3><p>LayoutEditor는 내부 측정 45초에서 8초, 메모리 40% 감소를 기록했습니다. 항공·물류·제조 데이터를 3D 화면과 시뮬레이션으로 구현했습니다.</p></div><div className="layout-pane"><span>100+ components</span><b>45s → 8s</b><small>internal project measurement</small></div></article>
    </div><div className="project-stream"><header><div><span>PROJECT STREAM</span><strong>19 BUILDS</strong></div><p>category / year / role / result</p></header><div className="project-table-head"><span>NO · CATEGORY</span><span>YEAR · ROLE</span><span>BUILD</span><span>RESULT</span></div>{projects.map(([no, category, year, role, name, result]) => <article key={no}><span>{no} · {category}</span><span>{year} · {role}</span><strong>{name}</strong><p>{result}</p></article>)}</div></section>}
    {page === "process" && <section id="process" className="content-section process-section"><div className="section-head"><p>ENGINEERING PRACTICE</p><h2>코드는 마지막 답입니다.<br />먼저 문제를 좁힙니다.</h2></div><div className="practice-grid">{[["01", "관찰", "업무 흐름과 실패 지점을 사용자 언어로 적고 로그와 화면을 함께 봅니다."], ["02", "구조", "상태, 도구, 인터페이스의 경계를 테스트 가능한 단위로 나눕니다."], ["03", "검증", "결과와 시스템 지표를 확인하고 실패 사례를 회귀 테스트로 남깁니다."]].map(([no,title,copy]) => <Reveal key={no}><span>{no}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}</div><div className="quality-table"><header>CODE QUALITY / INTERNAL STANDARD</header>{[["가독성","한 번에 읽어야 할 맥락을 줄입니다."],["예측 가능성","이름과 동작이 같은 기대를 만듭니다."],["응집도","함께 바뀌는 화면, 상태, 테스트를 가까이 둡니다."],["결합도","변경이 번지는 경계를 좁힙니다."]].map(([name,copy],i)=><div key={name}><span>0{i+1}</span><strong>{name}</strong><p>{copy}</p></div>)}</div></section>}
    {page === "career" && <section id="career" className="content-section career-section"><div className="section-head"><p>CAREER</p><h2>현장 품질에서<br />AI 제품까지</h2></div><CareerCodeTrack /></section>}
    {page === "contact" && <section id="contact" className="content-section contact-section"><div className="contact-copy"><p>CONTACT</p><h2>풀고 싶은 문제가 있다면<br />제품의 언어로 이야기해요.</h2><span>AI Agent 구축부터 프론트엔드 제품 개발까지. 사용자에게 필요한 결과부터 함께 정의하겠습니다.</span></div><div className="contact-list"><a href="mailto:kimdowon1404@gmail.com"><EnvelopeSimpleIcon size={20} /><span>Email</span><strong>kimdowon1404@gmail.com</strong></a><a href="tel:01090762409"><PhoneIcon size={20} /><span>Phone</span><strong>010-9076-2409</strong></a><a href="https://github.com/KoreaMoney" target="_blank" rel="noreferrer"><GithubLogoIcon size={20} /><span>GitHub</span><strong>KoreaMoney</strong></a><a href="https://www.linkedin.com/in/dowon-kim-415646237/" target="_blank" rel="noreferrer"><LinkedinLogoIcon size={20} /><span>LinkedIn</span><strong>dowon-kim</strong></a></div></section>}
  </main>;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <><a href="#main" className="skip-link">본문으로 건너뛰기</a><CommandNav />{children}<footer className="site-footer"><span>© 2026 Kim Dowon</span><span>Seoul · Frontend Engineering ↔ AI Agent ↔ Product</span><Link href="/legal">Privacy · Terms</Link></footer></>;
}
