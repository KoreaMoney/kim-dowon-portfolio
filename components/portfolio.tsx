"use client";

import {
  ArrowDownIcon, ArrowUpRightIcon, BracketsCurlyIcon, BriefcaseIcon,
  DownloadSimpleIcon, EnvelopeSimpleIcon, GithubLogoIcon, LinkedinLogoIcon,
  ListIcon, PhoneIcon, PulseIcon, SquaresFourIcon, UserIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { id: "intro", label: "Start", icon: UserIcon },
  { id: "signals", label: "Signals", icon: PulseIcon },
  { id: "work", label: "Projects", icon: SquaresFourIcon },
  { id: "process", label: "Practice", icon: BracketsCurlyIcon },
  { id: "career", label: "Career", icon: BriefcaseIcon },
  { id: "contact", label: "Contact", icon: EnvelopeSimpleIcon },
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

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={{ opacity: 0, y: reduced ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .14 }} transition={{ duration: reduced ? .15 : .6, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function CommandNav({ active }: { active: string }) {
  const current = navItems.find((item) => item.id === active)?.label ?? "Start";
  return (
    <nav className="command-nav" aria-label="주요 섹션">
      <a href="#intro" className="command-brand" aria-label="처음으로"><b>KD</b><span>Kim Dowon</span></a>
      <Sheet>
        <SheetTrigger asChild><button className="command-jump" type="button"><ListIcon size={18} /><span>Jump to section</span><b>{current}</b></button></SheetTrigger>
        <SheetContent title="Jump to section">
          <div className="command-menu"><p>SECTION INDEX</p>{navItems.map((item, index) => { const Icon = item.icon; return <SheetClose asChild key={item.id}><a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}><span>0{index + 1}</span><Icon size={19} /><strong>{item.label}</strong><ArrowDownIcon size={16} /></a></SheetClose>; })}</div>
        </SheetContent>
      </Sheet>
      <Button asChild variant="secondary"><a href="/kim-dowon-portfolio.pdf" download>PDF <DownloadSimpleIcon size={17} /></a></Button>
    </nav>
  );
}

function EventConsole() {
  const reduced = useReducedMotion();
  const consoleRef = useRef<HTMLElement>(null);
  const inView = useInView(consoleRef, { amount: .25 });
  const [activeEvent, setActiveEvent] = useState(0);
  const events = [["00:01", "request", "예약을 변경하고 싶어요"], ["00:02", "route", "booking.change"], ["00:03", "agent", "조건과 사용자 확인"], ["00:04", "tool", "availability.lookup"], ["00:05", "result", "10월 31일 14:30"]];
  useEffect(() => { if (reduced || !inView) return; const timer = window.setInterval(() => setActiveEvent((value) => (value + 1) % events.length), 900); return () => window.clearInterval(timer); }, [inView, reduced, events.length]);
  return <aside ref={consoleRef} className="event-console" aria-label="요청이 결과로 이어지는 Agent event stream"><div className="console-title"><span>EVENT STREAM<span className="typed-cursor">_</span></span><span className={`live-dot ${inView && !reduced ? "is-live" : ""}`}>LIVE</span></div><div className="console-events">{events.map(([time, name, value], index) => <motion.div className={activeEvent === index ? "is-active" : ""} key={name} initial={{ opacity: .28, x: reduced ? 0 : -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * .12, duration: .4 }}><time>{time}</time><b>{name}</b><span>{value}</span><i /></motion.div>)}</div><div className="profile-grid"><span>EXPERIENCE</span><strong>5년</strong><span>RANGE</span><strong>Frontend Engineering ↔ AI Agent ↔ Product</strong></div></aside>;
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
function OpenDoorVisual() { return <div className="mini-product door-mini"><header><span>INPUT</span><b>시장 진입 검토</b></header><div>{["Research","Finance","Legal","Global","Patent","Tech","Strategy"].map((item) => <span key={item}>{item}</span>)}</div><footer><span>OUTPUT</span><b>의사결정 문서</b></footer></div>; }

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
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { amount: .25 });
  const [active, setActive] = useState(0);
  const [autoDone, setAutoDone] = useState(false);
  const userInteracted = useRef(false);
  const milestones = [
    { commit:"qa.init@2017", year:"2016–17", period:"2016.08 - 2017.11", label:"QA", company:"제이셋스태츠칩팩코리아(유)", role:"QA ShiftLeader 책임", copy:"공정 불량 추적과 통계 집계를 자동화하고 현장 품질 알림을 만들었습니다.", metrics:[["70%","tracking time reduction"]] },
    { commit:"frontend.ship@2023", year:"2023–24", period:"2023.04 - 2024.09", label:"Frontend", company:"Infoin", role:"Frontend Engineer", copy:"항공·물류·제조 데이터를 3D 디지털 트윈과 시뮬레이션 화면으로 옮겼습니다.", metrics:[["35s → 15s","loading"],["1.95GB → 912MB","memory"]] },
    { commit:"agent.build@2024", year:"2024–25", period:"2024.09 - 2025.10", label:"AI Agent", company:"SBT Global", role:"Frontend Engineer · AI Agent", copy:"Agent와 편집 도구, 다이어그램, 스프레드시트의 상태와 성능을 개선했습니다.", metrics:[["45s → 8s","loading"],["−40%","memory"],["100+","components"]] },
    { commit:"product.launch@2025", year:"2025–", period:"2025.10 - 현재", label:"Product", company:"WiseAI", role:"AI Agent Pro · Frontend", copy:"병원 상담예약 Agent와 10개 언어 실시간 번역 Agent, 운영 도구를 제품 흐름으로 연결했습니다.", metrics:[["15s → 7s","translation"],["10","languages"],["5","reservation flows"]] },
    { commit:"main@now", year:"NOW", period:"2026 - 현재", label:"Founder", company:"OpenDoorLabs", role:"Founder · AI Product Engineer", copy:"검증 가능한 전문 역할 협업형 AI 제품을 직접 설계하고 운영합니다.", metrics:[["300","queries"],["175","tests"],["8","papers"]] },
  ];
  useEffect(() => {
    if (reduced || !inView || autoDone || userInteracted.current || window.matchMedia("(max-width: 680px)").matches) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(active + 1, milestones.length - 1);
      setActive(next);
      if (next === milestones.length - 1) setAutoDone(true);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [active, autoDone, inView, milestones.length, reduced]);
  const selectMilestone = (index: number) => {
    userInteracted.current = true;
    setAutoDone(true);
    setActive(index);
  };
  const item = milestones[active];
  return <div ref={trackRef} className="career-code-track" aria-label="2016년 QA에서 현재 AI 제품 개발까지 이어지는 경력 commit log"><header className="career-code-head"><code>$ git log --career --oneline</code><span>5 YEARS / CONTINUOUS DELIVERY</span></header><div className="commit-graph" style={{ "--commit-index": active } as React.CSSProperties}><span className="commit-base" aria-hidden="true" /><span className="commit-progress" aria-hidden="true" /><span className="commit-caret" aria-hidden="true">&gt;_</span>{milestones.map((mark, index) => <button type="button" className={`commit-node ${active === index ? "is-active" : ""}`} onClick={() => selectMilestone(index)} key={mark.commit} aria-label={`${mark.commit} ${mark.company} 선택`} aria-pressed={active === index}><i /><code>{mark.commit}</code><span>{mark.year} · {mark.label}</span></button>)}</div><div className="career-detail"><AnimatePresence mode="wait"><motion.div className="career-detail-content" key={item.company} initial={{ x:reduced?0:12 }} animate={{ x:0 }} exit={{ x:reduced?0:-12 }} transition={{ duration:.28,ease:[.22,1,.36,1] }}><div className="career-summary"><span>CHECKOUT / {item.commit}</span><h3>{item.company}</h3><b>{item.role}</b><p>{item.copy}</p></div><div className="career-metrics">{item.metrics.map(([value,label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></motion.div></AnimatePresence></div><div className="career-records" aria-label="전체 경력 목록">{milestones.map((mark, index) => <article className={active === index ? "is-active" : ""} key={mark.commit}><button type="button" onClick={() => selectMilestone(index)} aria-pressed={active === index}><code>{active === index ? ">_ " : ""}{mark.commit}</code><strong>{mark.company}</strong><span>{mark.period} · {mark.role}</span></button><p>{mark.copy}</p><div>{mark.metrics.map(([value,label]) => <span key={label}><strong>{value}</strong><small>{label}</small></span>)}</div></article>)}</div></div>;
}

export function Portfolio() {
  const [active, setActive] = useState("intro"); const sectionsRef = useRef<HTMLElement[]>([]);
  useEffect(() => { sectionsRef.current = navItems.map(({ id }) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node)); const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(visible.target.id); }, { rootMargin: "-20% 0px -65% 0px", threshold: [.05, .35] }); sectionsRef.current.forEach((section) => observer.observe(section)); return () => observer.disconnect(); }, []);
  return <><a href="#main" className="skip-link">본문으로 건너뛰기</a><CommandNav active={active} /><main id="main">
    <section id="intro" className="hero-section"><div className="hero-copy"><p className="eyebrow">AI AGENT · FRONTEND ENGINEER</p><h1>프론트엔드로 경험을 만들고,<br />AI Agent로 일을 연결합니다.</h1><p>사용자가 겪는 문제를 먼저 찾습니다. 보이는 화면과 그 뒤의 Agent 흐름을 함께 설계하고, 문제가 풀릴 때까지 팀과 조율합니다.</p><div className="hero-actions"><Button asChild><a href="#work">프로젝트 보기 <ArrowDownIcon size={17} /></a></Button><Button asChild variant="secondary"><a href="mailto:kimdowon1404@gmail.com">대화 시작하기 <EnvelopeSimpleIcon size={17} /></a></Button></div><code className="build-command">$ build product --from problem --to value</code></div><EventConsole /></section>
    <SignalConsole />
    <section id="work" className="content-section work-section"><div className="section-head"><p>SELECTED WORK</p><h2>업무의 복잡함을<br />작동하는 제품으로</h2><span>AI Agent와 프론트엔드를 분리하지 않고 사용자가 일을 끝내는 흐름으로 설계합니다.</span></div><MetricRail /><div className="featured-work">
      <article className="feature-case"><div className="feature-copy"><small>01 / WISE DENTAL</small><h3>상담에서 예약까지<br />문맥을 이어갑니다.</h3><p>병원 정보, AI 상담, 상담원 연결과 예약 생성·조회·변경·취소를 한 대화 안에서 처리합니다.</p><a href="https://wisedental.aiu-aipage.co.kr/" target="_blank" rel="noreferrer">서비스 보기 <ArrowUpRightIcon size={16} /></a></div><WiseDentalVisual /></article>
      <article className="feature-case translation-case"><div className="feature-copy"><small>02 / TRANSLATION AGENT</small><h3>10개 언어 실시간 번역 Agent를<br />직접 설계하고 개발했습니다.</h3><p>번역 요청부터 언어 분기, 문맥 유지, 결과 반환까지 전체 흐름을 설계·개발했습니다. 중복 모델 호출을 제거해 내부 측정 처리 시간을 15초에서 7초로 줄였습니다.</p><div className="fact-line"><span>10 languages</span><span>15s → 7s</span><span>약 53% 단축</span></div></div><TranslationVisual /></article>
      <article className="feature-case"><div className="feature-copy"><small>03 / OPEN DOOR LABS</small><h3>전문 역할의 판단을<br />검증할 수 있게</h3><p>OpenStockAI, OpenDataLabs, OpenAlarm을 통해 입력, 전문 역할별 작업, 근거 있는 결과를 하나의 제품 흐름으로 만듭니다.</p><div className="fact-line"><span>300 대표 질의</span><span>175 계약 테스트</span><span>8 논문</span></div><a href="https://opendoor.supply/ko" target="_blank" rel="noreferrer">플랫폼 보기 <ArrowUpRightIcon size={16} /></a></div><OpenDoorVisual /></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>04 / AX · BROWSER AGENT</small><h3>Agent를 운영하는 화면</h3><p>관리자가 설정과 상태를 읽는 AX Admin, 브라우저 실행과 결과 관찰을 잇는 Browser + Observer Agent를 개발했습니다.</p></div><div className="ascii-pane"><code>browser.run()</code><code>observer.capture()</code><code>agent.decide()</code><code>admin.review()</code></div></article>
      <article className="feature-case compact-case"><div className="feature-copy"><small>05 / LAYOUT · DIGITAL TWIN</small><h3>무거운 편집과 3D 정보를 빠르게</h3><p>LayoutEditor는 내부 측정 45초에서 8초, 메모리 40% 감소를 기록했습니다. 항공·물류·제조 데이터를 3D 화면과 시뮬레이션으로 구현했습니다.</p></div><div className="layout-pane"><span>100+ components</span><b>45s → 8s</b><small>internal project measurement</small></div></article>
    </div><div className="project-stream"><header><div><span>PROJECT STREAM</span><strong>19 BUILDS</strong></div><p>category / year / role / result</p></header><div className="project-table-head"><span>NO · CATEGORY</span><span>YEAR · ROLE</span><span>BUILD</span><span>RESULT</span></div>{projects.map(([no, category, year, role, name, result]) => <article key={no}><span>{no} · {category}</span><span>{year} · {role}</span><strong>{name}</strong><p>{result}</p></article>)}</div></section>
    <section id="process" className="content-section process-section"><div className="section-head"><p>ENGINEERING PRACTICE</p><h2>코드는 마지막 답입니다.<br />먼저 문제를 좁힙니다.</h2></div><div className="practice-grid">{[["01", "관찰", "업무 흐름과 실패 지점을 사용자 언어로 적고 로그와 화면을 함께 봅니다."], ["02", "구조", "상태, 도구, 인터페이스의 경계를 테스트 가능한 단위로 나눕니다."], ["03", "검증", "결과와 시스템 지표를 확인하고 실패 사례를 회귀 테스트로 남깁니다."]].map(([no,title,copy]) => <Reveal key={no}><span>{no}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}</div><div className="quality-table"><header>CODE QUALITY / INTERNAL STANDARD</header>{[["가독성","한 번에 읽어야 할 맥락을 줄입니다."],["예측 가능성","이름과 동작이 같은 기대를 만듭니다."],["응집도","함께 바뀌는 화면, 상태, 테스트를 가까이 둡니다."],["결합도","변경이 번지는 경계를 좁힙니다."]].map(([name,copy],i)=><div key={name}><span>0{i+1}</span><strong>{name}</strong><p>{copy}</p></div>)}</div></section>
    <section id="career" className="content-section career-section"><div className="section-head"><p>CAREER</p><h2>현장 품질에서<br />AI 제품까지</h2></div><CareerCodeTrack /></section>
    <section id="contact" className="content-section contact-section"><div className="contact-copy"><p>CONTACT</p><h2>풀고 싶은 문제가 있다면<br />제품의 언어로 이야기해요.</h2><span>AI Agent 구축부터 프론트엔드 제품 개발까지. 사용자에게 필요한 결과부터 함께 정의하겠습니다.</span></div><div className="contact-list"><a href="mailto:kimdowon1404@gmail.com"><EnvelopeSimpleIcon size={20} /><span>Email</span><strong>kimdowon1404@gmail.com</strong></a><a href="tel:01090762409"><PhoneIcon size={20} /><span>Phone</span><strong>010-9076-2409</strong></a><a href="https://github.com/KoreaMoney" target="_blank" rel="noreferrer"><GithubLogoIcon size={20} /><span>GitHub</span><strong>KoreaMoney</strong></a><a href="https://www.linkedin.com/in/dowon-kim-415646237/" target="_blank" rel="noreferrer"><LinkedinLogoIcon size={20} /><span>LinkedIn</span><strong>dowon-kim</strong></a></div></section>
  </main><footer className="site-footer"><span>© 2026 Kim Dowon</span><span>Seoul · Frontend Engineering ↔ AI Agent ↔ Product</span><a href="/legal">Privacy · Terms</a></footer></>;
}
