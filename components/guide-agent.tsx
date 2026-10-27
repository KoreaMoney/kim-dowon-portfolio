"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowCounterClockwiseIcon, PaperPlaneRightIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideCard } from "@/lib/guide/presentation";
import type { GuideConversationMemory } from "@/lib/guide/safety";
import Markdown from "react-markdown";
import { useLocale, type Locale } from "@/components/locale-provider";
import { createExitIntentTracker } from "@/lib/guide/exit-intent";
import { nextGuideIntroIndex, shouldShowGuideIntro } from "@/lib/intro-guide-lifecycle";

type GuideMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "portfolio";
  cards?: GuideCard[];
  switchLocale?: Locale;
};

type GuideResponse = {
  answer: string;
  suggestions: string[];
  source: "ai" | "portfolio";
  cards?: GuideCard[];
  memory: GuideConversationMemory;
};

function createEmptyGuideMemory(): GuideConversationMemory {
  return { targetRole: "unknown", coveredEvidence: [], roleAsked: false };
}

const introStories = [
  { label: "Frontend와 AI Agent를 함께 만듭니다", body: "저는 사용자의 선택이 화면에서 끝나지 않고 실제 업무 완료로 이어지도록 제품 흐름을 개발합니다.", question: "Frontend와 AI Agent를 함께 개발한 경험을 알려주세요", action: "개발·개선 경험 물어보기" },
  { label: "제품을 만들고, 사용 중의 문제까지 개선합니다", body: "저는 Frontend와 AI Agent를 개발하고, 사용 과정의 병목을 찾아 개선합니다. 내부 측정에서 편집 화면 로딩은 45초→8초, 번역 처리는 15초→7초로 줄였습니다.", question: "제품 개발 후 성능과 사용 흐름을 개선한 경험을 알려주세요", action: "개발·개선 경험 물어보기" },
  { label: "출시 뒤에도 제품을 계속 개선합니다", body: "병원 예약과 10개 언어 번역 Agent, OpenStockAI와 OpenAlarm을 만들었습니다. 각 제품을 어떻게 개발하고 개선했는지 물어보세요.", question: "제품을 개발하고 개선한 경험을 알려주세요", action: "개발·개선 경험 묻기" },
] as const;

const introStoriesEn = [
  { label: "I build Frontend and AI Agents together", body: "I build product flows that carry a user's choice from the interface to completed work.", question: "Tell me about work where you built Frontend and AI Agents together", action: "Ask about my work" },
  { label: "I build products and improve how they are used", body: "I build Frontend and AI Agents, then improve bottlenecks in the user flow. In internal measurements, I reduced editor loading from 45s→8s and translation processing from 15s→7s.", question: "Tell me how you improved performance and product flows after development", action: "Ask about my work" },
  { label: "I keep improving products after launch", body: "I built hospital booking and 10-language translation Agents, OpenStockAI, and OpenAlarm. Ask how I developed and improved each product.", question: "Tell me about products you developed and improved", action: "Ask about my work" },
] as const;

const GUIDE_ENGAGED_SESSION_KEY = "trace-guide:explicitly-engaged";
const GUIDE_DISMISSED_SESSION_KEY = "trace-guide:intro-dismissed";

function readGuideSessionFlag(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeGuideSessionFlag(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // The guide still works when storage is unavailable.
  }
}

function TraceBot() {
  return (
    <svg viewBox="0 0 68 76" aria-hidden="true" focusable="false">
      <g className="trace-antenna">
        <path d="M43 13 49 4" />
        <rect className="trace-led" x="47" y="1" width="7" height="7" />
      </g>
      <path className="trace-shell" d="M7 17h48l7 8v40l-8 7H12l-7-8V25z" />
      <path className="trace-face" d="M12 23h39l5 5v29l-5 6H12z" />
      <g className="trace-eyes">
        <rect x="20" y="34" width="6" height="6" />
        <rect x="42" y="34" width="6" height="6" />
      </g>
      <path className="trace-mouth" d="m22 48 5 4-5 4m9 0h12" />
      <path className="trace-port" d="M7 30H2m60 8h4M18 70v5m31-5v5" />
    </svg>
  );
}

export function GuideAgent() {
  const {locale} = useLocale();
  return <LocalizedGuide key={locale} />;
}

function LocalizedGuide() {
  const pathname = usePathname();
  const {locale,setLocale} = useLocale();
  const en = locale === "en";
  const starters = en ? ["Why hire me?", "AI Agent achievements", "Frontend skills", "Featured projects", "Career overview"] : ["채용하면 좋은 점은?", "AI Agent 성과만 보기", "프론트엔드 역량 요약", "대표 프로젝트 추천", "경력 흐름 보기"];
  const initialMessage: GuideMessage = {id:"trace-ready",role:"assistant",source:"portfolio",content:en ? "I connect Frontend and AI Agents in one product flow. Ask about my five years of experience, projects, or measurable results." : "저는 Frontend와 AI Agent를 한 제품 흐름으로 설계합니다. 5년의 경력, 프로젝트와 성과가 궁금하면 물어보세요."};
  const stories = en ? introStoriesEn : introStories;
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [exitPitch, setExitPitch] = useState(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const [messages, setMessages] = useState<GuideMessage[]>([initialMessage]);
  const [suggestions, setSuggestions] = useState<string[]>([...starters]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [conversationMemory, setConversationMemory] = useState<GuideConversationMemory>(createEmptyGuideMemory);
  const moduleRef = useRef<HTMLSpanElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);
  const exitIntentRef = useRef<ReturnType<typeof createExitIntentTracker> | null>(null);
  const explicitlyEngagedRef = useRef(false);
  const introDismissedRef = useRef(false);
  const conversationMemoryRef = useRef<GuideConversationMemory>(conversationMemory);

  useEffect(() => {
    if (!visible) return;
    const tracker = exitIntentRef.current ??= createExitIntentTracker(Date.now());
    tracker.disarm();
    if (open || pathname === "/contact") return;
    const observeMouse = (event: PointerEvent) => {
      if (event.isTrusted && event.pointerType === "mouse" && event.clientX > 8 && event.clientY > 8
        && event.clientX < window.innerWidth - 8 && event.clientY < window.innerHeight - 8) tracker.observeMouse();
    };
    const leave = (event: MouseEvent) => {
      const guard = !window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches ? "media"
        : document.visibilityState !== "visible" ? "hidden"
        : document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"], dialog[open]') ? "dialog" : null;
      const eligible = !guard && tracker.leave({ x:event.clientX, y:event.clientY, width:window.innerWidth, height:window.innerHeight,
        relatedTarget:event.relatedTarget, trusted:event.isTrusted, buttons:event.buttons }, Date.now());
      if (!eligible) return;
      setExitPitch(true);
      setOpen(true);
    };
    const disarm = () => tracker.disarm();
    document.addEventListener("pointermove", observeMouse, { passive:true });
    document.addEventListener("mouseout", leave);
    document.addEventListener("visibilitychange", disarm);
    return () => {
      document.removeEventListener("pointermove", observeMouse);
      document.removeEventListener("mouseout", leave);
      document.removeEventListener("visibilitychange", disarm);
    };
  }, [visible, open, pathname]);

  useEffect(() => {
    explicitlyEngagedRef.current = readGuideSessionFlag(GUIDE_ENGAGED_SESSION_KEY);
    introDismissedRef.current = readGuideSessionFlag(GUIDE_DISMISSED_SESSION_KEY);
    const timer = window.setTimeout(() => {
      setVisible(true);
      if (shouldShowGuideIntro({ explicitlyEngaged: explicitlyEngagedRef.current, dismissed: introDismissedRef.current })) {
        setIntroIndex(0);
        setIntroVisible(true);
      }
    }, reduced ? 0 : 1_400);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!introVisible || reduced) return;
    const nextIndex = nextGuideIntroIndex(introIndex, stories.length);
    if (nextIndex === null) return;
    const timer = window.setTimeout(() => {
      setIntroIndex(nextIndex);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [introIndex, introVisible, reduced, stories.length]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = messagesRef.current;
      if (container) {
        const latest = container.querySelector<HTMLElement>("article:last-of-type");
        if (status !== "loading" && latest) {
          container.scrollTop += latest.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
        } else container.scrollTop = container.scrollHeight;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, status]);

  useEffect(() => {
    const botModule = moduleRef.current;
    if (!visible || reduced || !botModule || !window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 681px)").matches) return;

    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const render = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      botModule.style.setProperty("--trace-eye-x", `${currentX * 3}px`);
      botModule.style.setProperty("--trace-eye-y", `${currentY * 2}px`);
      botModule.style.setProperty("--trace-shift-x", `${currentX * 3}px`);
      botModule.style.setProperty("--trace-shift-y", `${currentY * 2}px`);
      botModule.style.setProperty("--trace-tilt", `${currentX * 2}deg`);
      botModule.style.setProperty("--trace-antenna", `${currentX * 6}deg`);
      frame = window.requestAnimationFrame(render);
    };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = botModule.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance > 320) {
        targetX = 0;
        targetY = 0;
        return;
      }
      targetX = Math.max(-1, Math.min(1, deltaX / 160));
      targetY = Math.max(-1, Math.min(1, deltaY / 160));
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    frame = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(frame);
    };
  }, [reduced, visible]);

  const markExplicitEngagement = useCallback(() => {
    explicitlyEngagedRef.current = true;
    writeGuideSessionFlag(GUIDE_ENGAGED_SESSION_KEY);
    setIntroVisible(false);
  }, []);

  const dismissIntro = useCallback(() => {
    introDismissedRef.current = true;
    writeGuideSessionFlag(GUIDE_DISMISSED_SESSION_KEY);
    setIntroVisible(false);
  }, []);

  const updateConversationMemory = useCallback((memory: GuideConversationMemory) => {
    conversationMemoryRef.current = memory;
    setConversationMemory(memory);
  }, []);

  const resetConversationMemory = useCallback(() => {
    updateConversationMemory(createEmptyGuideMemory());
  }, [updateConversationMemory]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setExitPitch(false);
      abortRef.current?.abort();
      abortRef.current = null;
      setStatus("idle");
    }
    setOpen(nextOpen);
    if (nextOpen) markExplicitEngagement();
  };

  const ask = useCallback(async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || question.length > 500 || abortRef.current) return;
    const targetLanguage: Locale | null = /영어로|영어\s*버전|영문\s*버전|영어.*(?:전환|바꿔|해줘)|\b(?:in english|english version|switch to english|english please)\b|^english\??$/i.test(question) ? "en" : /한국어로|한글\s*버전|한국어.*(?:전환|바꿔)|\b(?:in korean|korean version|switch to korean|korean please)\b|^korean\??$/i.test(question) ? "ko" : null;
    if (targetLanguage) {
      setMessages(current => [...current,
        {id:`user-${++sequenceRef.current}`,role:"user",content:question},
        {id:`assistant-${++sequenceRef.current}`,role:"assistant",source:"portfolio",content:en ? "Use the button below to change the entire portfolio, including navigation, projects, career, and this guide." : "아래 버튼을 누르면 메뉴, 프로젝트, 경력과 이 챗봇까지 포트폴리오 전체 언어가 바뀝니다.",switchLocale:targetLanguage},
      ]);
      setDraft("");
      return;
    }

    const history = messages.slice(-12).map(({ role, content }) => ({ role, content }));
    const userMessage: GuideMessage = { id: `user-${++sequenceRef.current}`, role: "user", content: question };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setStatus("loading");
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, locale, memory: conversationMemoryRef.current }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("guide request failed");
      const data = (await response.json()) as GuideResponse;
      if (abortRef.current !== controller) return;
      if (data.memory) updateConversationMemory(data.memory);
      const assistantMessage: GuideMessage = {
        id: `assistant-${++sequenceRef.current}`,
        role: "assistant",
        content: data.answer,
        source: data.source,
        cards: data.cards,
      };
      setMessages((current) => [...current, assistantMessage]);
      setSuggestions(data.suggestions.slice(0, 5));
      setStatus("idle");
    } catch {
      if (abortRef.current !== controller) return;
      if (controller.signal.aborted) {
        setMessages((current) => [...current, {
          id: `assistant-${++sequenceRef.current}`,
          role: "assistant",
          content: en ? "The response is taking longer than expected. Please try again or explore my project pages." : "답변을 기다리는 시간이 길어졌어요. 질문을 다시 선택하거나 프로젝트 페이지에서 경력과 성과를 확인해 주세요.",
          source: "portfolio",
        }]);
        setStatus("idle");
        return;
      }
      setMessages((current) => [...current, {
        id: `assistant-${++sequenceRef.current}`,
        role: "assistant",
        content: en ? "I couldn't connect right now. You can find my work and results on the Projects and Career pages." : "지금은 연결이 원활하지 않습니다. 프로젝트와 경력 페이지에서 검증된 내용을 바로 확인할 수 있어요.",
        source: "portfolio",
      }]);
      setStatus("error");
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [messages,locale,en,updateConversationMemory]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void ask(draft);
  };

  const lastMessage = messages[messages.length - 1];
  const roleGuidance = conversationMemory.targetRole === "unknown"
    ? ""
    : en
      ? ` Tailoring this guide to a ${conversationMemory.targetRole === "hybrid" ? "Frontend + AI Agent" : conversationMemory.targetRole === "frontend" ? "Frontend" : "AI Agent"} role.`
      : ` 현재 ${conversationMemory.targetRole === "hybrid" ? "Frontend + AI Agent" : conversationMemory.targetRole === "frontend" ? "프론트엔드" : "AI Agent"} 포지션에 맞춰 안내하고 있습니다.`;
  const liveStatus = status === "loading"
    ? en ? "Looking up my portfolio evidence." : "포트폴리오 근거를 찾고 있습니다."
    : lastMessage.role === "assistant" ? lastMessage.content : "";

  const resetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([initialMessage]);
    setSuggestions([...starters]);
    setDraft("");
    setStatus("idle");
    resetConversationMemory();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const changeLocale = (nextLocale: Locale) => {
    resetConversationMemory();
    setLocale(nextLocale);
  };

  if (!visible) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <motion.div
        className="trace-guide-dock"
        initial={reduced ? false : { opacity: 0, x: 38, y: 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 250, damping: 24 }}
      >
        {introVisible && !open && (
          <div className="trace-intro" role="status">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={stories[introIndex].label} initial={reduced ? false : { opacity:.75, y:5 }} animate={{ opacity:1, y:0 }} exit={reduced ? { opacity:1 } : { opacity:.75, y:-4 }} transition={{ duration:reduced ? 0 : .3 }}>
                <span>{stories[introIndex].label}</span>
                <p>{stories[introIndex].body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="trace-intro-progress" aria-hidden="true">{stories.map((story, index) => <i className={index === introIndex ? "is-active" : ""} key={story.label} />)}</div>
            <div>
              <button type="button" onClick={() => { handleOpenChange(true); void ask(stories[introIndex].question); }}>{stories[introIndex].action}</button>
              <button type="button" onClick={dismissIntro}>{en ? "Dismiss" : "닫기"}</button>
            </div>
          </div>
        )}
        <Dialog.Trigger asChild>
          <button className="trace-bot-trigger" type="button" aria-label={en ? "Open Kim Dowon AI guide" : "Kim Dowon Guide Agent 열기"}>
            <span className="trace-bot-module" ref={moduleRef}><TraceBot /></span>
            <span className="trace-bot-label">TRACE_01</span>
          </button>
        </Dialog.Trigger>
      </motion.div>

      <Dialog.Portal>
        <Dialog.Overlay className="guide-overlay" />
        {exitPitch ? (
          <Dialog.Content className="guide-exit-panel" aria-describedby="guide-exit-description">
            <Dialog.Close className="guide-close guide-exit-close" aria-label={en ? "Close hiring introduction" : "채용 제안 닫기"}><XIcon size={22} /></Dialog.Close>
            <div className="guide-exit-hero">
              <motion.span className="trace-bot-module guide-exit-bot" initial={reduced ? false : { scale:.35, rotate:-8 }} animate={{ scale:1, rotate:0 }} transition={reduced ? { duration:0 } : { type:"spring", stiffness:220, damping:19 }}><TraceBot /></motion.span>
              <span className="guide-exit-eyebrow">TRACE_01 / ONE MORE THING</span>
              <Dialog.Title>{en ? "Before you go, meet your next product builder." : "잠깐만요!\n다음 제품, 김도원님과 만들어보세요."}</Dialog.Title>
              <Dialog.Description id="guide-exit-description">{en ? "Hire Kim Dowon to connect product development with business needs — from the customer problem to the interface and AI Agent that solve it." : "김도원님을 채용해보세요. 제품 개발부터 사업의 문제를 이해하는 일까지, 고객의 필요를 실제로 작동하는 화면과 AI Agent로 연결합니다."}</Dialog.Description>
            </div>
            <ul className="guide-exit-reasons">
              <li><span>01 / BUILD</span><strong>{en ? "More ideas into products" : "더 많은 아이디어를 제품으로"}</strong><p>{en ? "Frontend + AI Agents, with hands-on experience building and running OpenDoorLabs products." : "Frontend와 AI Agent를 함께 개발하고, OpenDoorLabs의 제품을 직접 설계·운영합니다."}</p></li>
              <li><span>02 / BUSINESS</span><strong>{en ? "A builder with an owner's perspective" : "사업을 함께 고민하는 개발자"}</strong><p>{en ? "Founder experience brings customer needs and operational workflows into product decisions." : "Founder 경험을 바탕으로 고객의 필요와 운영 흐름을 제품의 기능과 우선순위로 연결합니다."}</p></li>
              <li><span>03 / IMPACT</span><strong>{en ? "Improvements you can measure" : "성과로 보여주는 실행력"}</strong><p>{en ? "Editor loading: 45s → 8s. Translation processing: 15s → 7s. Based on internal measurements." : "편집 화면 로딩 45초 → 8초, 번역 처리 15초 → 7초. 내부 측정으로 확인한 개선입니다."}</p></li>
            </ul>
            <div className="guide-exit-actions">
              <Link href="/contact" onClick={() => handleOpenChange(false)}>{en ? "Let's talk about hiring" : "김도원님께 채용 제안하기"}<PaperPlaneRightIcon size={19} /></Link>
              <button type="button" onClick={() => { markExplicitEngagement(); setExitPitch(false); void ask(en ? "Why hire me?" : "채용하면 좋은 점은?"); }}>{en ? "Ask the AI guide" : "AI에게 강점 더 물어보기"}</button>
              <Dialog.Close className="guide-exit-dismiss">{en ? "Continue browsing" : "괜찮아요, 계속 둘러볼게요"}</Dialog.Close>
            </div>
          </Dialog.Content>
        ) : <Dialog.Content className="guide-panel" aria-describedby="guide-description">
          <header className="guide-panel-head">
            <div>
              <span>TRACE_01 / PORTFOLIO GRAPH</span>
              <Dialog.Title>{en ? "Kim Dowon's AI guide" : "김도원의 AI 소개"}</Dialog.Title>
            </div>
            <div className="guide-head-actions">
              <button type="button" className="guide-new" onClick={resetConversation} aria-label={en ? "New conversation" : "새 대화 시작"}><ArrowCounterClockwiseIcon size={16} /><span>NEW TRACE</span></button>
              <Dialog.Close className="guide-close" aria-label={en ? "Close guide" : "Guide Agent 닫기"}><XIcon size={20} /></Dialog.Close>
            </div>
          </header>
          <div className="guide-panel-body">
            <Dialog.Description id="guide-description">{en ? "An AI guide presenting my experience in the first person, grounded in this portfolio." : "제 경험을 1인칭으로 소개하는 AI입니다. 포트폴리오에 기록된 근거로 답합니다."}{roleGuidance}</Dialog.Description>
            <button className="guide-language" type="button" onClick={() => changeLocale(en ? "ko" : "en")}>{en ? "한국어 포트폴리오로 전환" : "English · 포트폴리오 전체 전환"}</button>

            {messages.length === 1 && <details className="guide-examples"><summary>{en ? "Example questions" : "예시 질문"} <span>{starters.length} · {en ? "expand / collapse" : "펼치기 / 접기"}</span></summary><div className="guide-starters" aria-label={en ? "Suggested questions" : "추천 질문"}>
              {starters.map((item) => <button type="button" key={item} onClick={() => void ask(item)} disabled={status === "loading"}>{item}</button>)}
            </div></details>}

            <div className="guide-messages" ref={messagesRef} aria-busy={status === "loading"}>
              {messages.map((message) => (
                <article className={`guide-message is-${message.role}`} key={message.id}>
                  <span>{message.role === "user" ? "YOU" : `TRACE_01 · ${message.source === "ai" ? "AI" : "PORTFOLIO"}`}</span>
                  <div className="guide-markdown"><Markdown skipHtml disallowedElements={["img"]} components={{ a: ({ children }) => <span>{children}</span> }}>{message.content.replace(/([^\n])\s+- (?=\*\*)/g, "$1\n\n- ")}</Markdown></div>
                  {message.switchLocale && <button className="guide-language" type="button" onClick={() => changeLocale(message.switchLocale!)}>{message.switchLocale === "en" ? "View entire portfolio in English" : "포트폴리오 전체 한국어로 보기"}</button>}
                  {!!message.cards?.length && <ol className="guide-answer-cards" aria-label={en ? "Supporting evidence" : "답변 근거"}>{message.cards.map((card) => <li key={card.title}><header>{card.subtitle && <small>{card.subtitle}</small>}<strong>{card.title}</strong></header>{card.metric && <b>{card.metric}</b>}<p>{card.detail}</p></li>)}</ol>}
                </article>
              ))}
              {status === "loading" && <div className="guide-thinking" role="status"><i /><span>{en ? "Reading project evidence and preparing an answer." : "프로젝트 근거를 읽고 답변을 작성하고 있어요."}</span></div>}
              {status === "error" && <p className="guide-error">{en ? "Connection failed. Please try again." : "연결 오류가 발생했습니다. 다시 시도해 주세요."}</p>}
            </div>
            <p className="sr-only" aria-live="polite" aria-atomic="true">{liveStatus}</p>

            {messages.length > 1 && suggestions.length > 0 && <details className="guide-examples"><summary>{en ? "Ask a follow-up" : "이어서 물어보기"} <span>{suggestions.length} · {en ? "expand / collapse" : "펼치기 / 접기"}</span></summary><div className="guide-followups" aria-label={en ? "Follow-up questions" : "후속 질문"}>
              {suggestions.map((item) => <button type="button" key={item} onClick={() => void ask(item)} disabled={status === "loading"}>{item}</button>)}
            </div></details>}
          </div>

          <div className="guide-composer">
            <form className="guide-input" onSubmit={onSubmit}>
              <label htmlFor="guide-question">{en ? "Ask about my work" : "김도원에게 물어보기"}</label>
              <div>
                <input ref={inputRef} id="guide-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder={en ? "Ask about my work" : "궁금한 점을 물어보세요"} autoComplete="off" />
                <button type="submit" disabled={!draft.trim() || status === "loading"} aria-label={en ? "Send question" : "질문 보내기"}><PaperPlaneRightIcon size={19} /></button>
              </div>
              <span>{draft.length}/500</span>
            </form>
            <nav className="guide-links" aria-label={en ? "Related portfolio pages" : "관련 포트폴리오 페이지"}>
              <Link href="/work" onClick={() => setOpen(false)}>{en ? "Projects" : "프로젝트 보기"}</Link>
              <Link href="/career" onClick={() => setOpen(false)}>{en ? "Career" : "경력 보기"}</Link>
            </nav>
          </div>
        </Dialog.Content>}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
