"use client";

import { ArrowDownIcon, HandGrabbingIcon, MusicNotesIcon, SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import type { OceanHandle } from "@/lib/ocean/app";
import { fetchWeather, type WeatherInfo } from "@/lib/ocean/solar";
import { OCEAN_SEEN_KEY as SEEN_KEY } from "@/lib/ocean-seen";
const VIEWS = ["Now", "Golden hour", "Breakers", "Lagoon", "Open ocean", "Aerial", "Flotsam", "Underwater"] as const;
const WATER_COLORS = ["clear", "tropical", "toxic green", "purple", "rust orange", "murky brown"] as const;
const TRACKS = [
  { src: "/audio/yeong-eseo-hanaro.mp3", title: "영에서 하나로" },
  { src: "/audio/baekji-wiro-geurin-naeil.mp3", title: "백지 위로 그린 내일" },
  { src: "/audio/sirin-neoui-ongi.mp3", title: "시린 너의 온기" },
] as const;
const SEOUL = { lat: 37.5665, lon: 126.978 };
const WEATHER_LABELS: Record<string, { ko: string; en: string }> = {
  clear: { ko: "맑음", en: "CLEAR" },
  "partly cloudy": { ko: "구름 조금", en: "PARTLY CLOUDY" },
  cloudy: { ko: "흐림", en: "CLOUDY" },
  fog: { ko: "안개", en: "FOG" },
  rain: { ko: "비", en: "RAIN" },
  showers: { ko: "소나기", en: "SHOWERS" },
  snow: { ko: "눈", en: "SNOW" },
  thunderstorm: { ko: "뇌우", en: "STORM" },
};

const BIO_SLIDES = [
  { kicker: "INTRO / PORTFOLIO", ko: ["사용자의 말이,", "완료된 일로 바뀌는 제품."], en: ["Your request,", "becomes finished work."] },
  { kicker: "EXPERIENCE · 5YR", ko: ["5년 — 19개 제품을", "직접 만들었습니다."], en: ["5 years —", "19 products shipped."] },
  { kicker: "DRIVE", ko: ["호기심이 동력입니다.", "궁금하면 직접 만들어봅니다."], en: ["Curiosity is the engine —", "if I'm curious, I build it."] },
  { kicker: "METHOD", ko: ["문제가 생기면 원인이", "보일 때까지 파고듭니다."], en: ["When something breaks, I dig", "until the root cause shows."] },
  { kicker: "BUILD", ko: ["새 기술은 제품에 적용하며 배웁니다.", "아이디어를 0에서 1로."], en: ["I learn new tech by shipping it —", "ideas, from 0 to 1."] },
  { kicker: "FOCUS", ko: ["Frontend와 AI Agent를", "한 제품 흐름으로 설계합니다."], en: ["Frontend and AI agents,", "designed as one flow."] },
  { kicker: "AI DEPTH", ko: ["Agent 설계 · RAG · 평가 ·", "회귀 테스트 · 운영 모니터링."], en: ["Agent design, RAG, evals,", "regression tests, monitoring."] },
  { kicker: "RESULT · WISEAI", ko: ["상담·예약 Agent 구축 —", "예약 전환율 40% 향상."], en: ["Consultation & booking agent —", "booking conversion +40%."] },
  { kicker: "RESULT · TRANSLATION", ko: ["번역 Agent 응답", "15초 → 7초로 단축."], en: ["Translation agent latency,", "cut 15s → 7s."] },
  { kicker: "RESULT · EDITOR", ko: ["LayoutEditor 로딩 45초 → 8초,", "메모리 사용량 −40%."], en: ["LayoutEditor load 45s → 8s,", "memory usage −40%."] },
  { kicker: "PROOF · OPENSTOCKAI", ko: ["300개 대표 질의,", "175개 라우팅 테스트 통과."], en: ["300 representative queries,", "175 routing tests passing."] },
  { kicker: "BELIEF", ko: ["빠르게 만들고, 실패에서 배우고,", "반복해서 개선합니다."], en: ["Build fast, learn from failure,", "iterate to better."] },
  { kicker: "KIM DOWON", ko: ["AI로 실제 문제를 해결하는", "개발자, 김도원입니다."], en: ["Kim Dowon — a developer who", "solves real problems with AI."] },
] as const;

const SLIDE_MS = 3800;

export function OceanIntro() {
  const { locale, t } = useLocale();
  const reduced = useReducedMotion();
  const mountRef = useRef<HTMLDivElement>(null);
  const oceanRef = useRef<OceanHandle | null>(null);
  const benchRef = useRef(false);
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [viewName, setViewName] = useState<string>("Now");
  const [colorName, setColorName] = useState<string>("clear");
  const [menu, setMenu] = useState<"view" | "color" | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const weatherRef = useRef<WeatherInfo | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<number[]>([]);
  const lastTrackRef = useRef(-1);
  const volumeRef = useRef(0.3);
  const lastVolumeRef = useRef(30);
  const [volume, setVolume] = useState(30);
  const [track, setTrack] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const open = () => {
      document.documentElement.classList.add("ocean-lock", "ocean-booted");
      setStep(0);
      setMenu(null);
      if (!oceanRef.current) setReady(false);   // only veil when the renderer must re-init
      setShow(true);
    };
    window.addEventListener("ocean:open", open);
    let raf = 0;
    const params = new URLSearchParams(window.location.search);
    benchRef.current = params.has("bench");   // captured before the strip below
    if (params.has("ocean")) {
      window.history.replaceState({}, "", window.location.pathname);
      raf = requestAnimationFrame(open);
    } else if (!sessionStorage.getItem(SEEN_KEY)) {
      raf = requestAnimationFrame(open);
    }
    return () => {
      window.removeEventListener("ocean:open", open);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("ocean-lock");
    };
  }, []);

  useEffect(() => {
    if (!show || !mountRef.current || oceanRef.current) return;
    let cancelled = false;
    fetchWeather(SEOUL.lat, SEOUL.lon)
      .then((w) => {
        weatherRef.current = w;
        if (!cancelled) setWeather(w);
        oceanRef.current?.setWeather(w);
      })
      .catch(() => {});
    import("@/lib/ocean/app")
      .then(({ createOcean }) => {
        if (cancelled || !mountRef.current || oceanRef.current) return;
        oceanRef.current = createOcean(mountRef.current, {
          view: "Now",
          coords: SEOUL,
          bench: benchRef.current,
          onReady: () => !cancelled && setReady(true),
        });
        if (reduced) oceanRef.current.pause();   // still ocean behind the static copy
        if (weatherRef.current) oceanRef.current.setWeather(weatherRef.current);
      })
      .catch(() => {
        // WebGL unavailable or failed — don't trap the visitor on the intro
        sessionStorage.setItem(SEEN_KEY, "1");
        setShow(false);
      });
    return () => { cancelled = true; };
  }, [show, reduced]);

  // the renderer stays alive through the exit animation; freed on exit-complete
  // (below) or here when the page unmounts mid-intro
  useEffect(() => () => {
    oceanRef.current?.dispose();
    oceanRef.current = null;
  }, []);

  // ambient track — songs play in a shuffled cycle so nothing repeats until
  // every track has been heard once
  useEffect(() => {
    if (!show) return;
    const nextIndex = () => {
      if (queueRef.current.length === 0) {
        const order = TRACKS.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        if (order[0] === lastTrackRef.current && order.length > 1) [order[0], order[1]] = [order[1], order[0]];
        queueRef.current = order;
      }
      return queueRef.current.shift() ?? 0;
    };
    const start = () => {
      const i = nextIndex();
      lastTrackRef.current = i;
      const next = TRACKS[i];
      audioRef.current?.pause();
      const el = new Audio(next.src);
      el.volume = volumeRef.current;
      el.addEventListener("ended", start);
      audioRef.current = el;
      setTrack(next.title);
      el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
    };
    start();
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      setTrack(null);
      setAudioBlocked(false);
    };
  }, [show]);

  // browsers block autoplay without a gesture — resume on the first interaction
  useEffect(() => {
    if (!audioBlocked) return;
    const resume = () => { audioRef.current?.play().then(() => setAudioBlocked(false)).catch(() => {}); };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return () => { window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); };
  }, [audioBlocked]);

  function setAudioVolume(v: number) {
    const vol = Math.min(100, Math.max(0, Math.round(v)));
    volumeRef.current = vol / 100;
    if (vol > 0) lastVolumeRef.current = vol;
    if (audioRef.current) audioRef.current.volume = vol / 100;
    setVolume(vol);
  }

  function toggleAudio() {
    if (audioBlocked) { audioRef.current?.play().then(() => setAudioBlocked(false)).catch(() => {}); return; }
    setAudioVolume(volume > 0 ? 0 : lastVolumeRef.current);
  }

  // live clock — matches the real-time sky
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, [show]);

  // bio sequence — advance once the ocean's first frame is on screen
  useEffect(() => {
    if (!ready || reduced) return;
    const id = setInterval(() => setStep((s) => (s + 1) % BIO_SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [ready, reduced]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) setMenu(null);
      else enter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function enter() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setMenu(null);
    document.documentElement.classList.remove("ocean-lock");
    setShow(false);   // AnimatePresence keeps the section alive while the exit plays
  }

  const ease = [0.22, 1, 0.36, 1] as const;
  const slide = BIO_SLIDES[step];
  if (typeof document === "undefined") return null;
  // portal to body: route-transition's transform would trap this in its stacking
  // context below the site nav (and break position:fixed on the viewport)
  return createPortal(
    <AnimatePresence onExitComplete={() => { oceanRef.current?.dispose(); oceanRef.current = null; }}>
      {show && (
        <motion.section
          className="ocean-intro"
          aria-label={t("김도원 포트폴리오 소개 — 실시간 오션 렌더")}
          initial={false}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: reduced ? 0.15 : 0.7, ease }}
        >
          <div ref={mountRef} className="ocean-canvas" aria-hidden="true" />

          <motion.div
            className="ocean-copy"
            initial="hidden"
            animate={ready ? "show" : "hidden"}
            variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.09 } } }}
          >
            <motion.p className="ocean-label" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.5, ease }}>
              KIM DOWON — FRONTEND · AI AGENT
            </motion.p>

            {reduced ? (
              <div className="ocean-slide ocean-slide--static">
                {BIO_SLIDES.map((s) => (
                  <p key={s.kicker}><span>{s.kicker}</span>{s[locale].join(" ")}</p>
                ))}
              </div>
            ) : (
              <div className="ocean-slide" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.55, ease }}
                  >
                    <p className="ocean-slide-kicker">{slide.kicker}<span>{String(step + 1).padStart(2, "0")} / {BIO_SLIDES.length}</span></p>
                    <h1>{slide[locale].map((line, i) => <span key={i}>{line}{i < slide[locale].length - 1 && <br />}</span>)}</h1>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            <motion.div className="ocean-copy-foot" variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.5, ease }}>
              {!reduced && (
                <div className="ocean-bio-dots" aria-hidden="true">
                  {BIO_SLIDES.map((s, i) => <i key={s.kicker} className={i === step ? "on" : ""} />)}
                </div>
              )}
              <Button type="button" className="ocean-enter" onClick={enter}>
                {t("포트폴리오 보러가기")} <ArrowDownIcon size={17} />
              </Button>
            </motion.div>
          </motion.div>

          <div className="ocean-hud">
            <span className="ocean-hint"><HandGrabbingIcon size={14} /> {t("드래그로 둘러보기")}</span>
            <div className="ocean-switches">
              {menu && <button className="ocean-menu-close" type="button" tabIndex={-1} aria-hidden="true" onClick={() => setMenu(null)} />}
              <div className="ocean-audio">
                <button type="button" onClick={toggleAudio} aria-label={t(volume === 0 || audioBlocked ? "음악 켜기" : "음악 끄기")}>
                  {volume === 0 || audioBlocked ? <SpeakerSlashIcon size={15} /> : <SpeakerHighIcon size={15} />}
                </button>
                <span className="ocean-track"><MusicNotesIcon size={12} />{track ?? "…"}</span>
                <input className="ocean-volume" type="range" min={0} max={100} value={volume} onChange={(e) => setAudioVolume(Number(e.target.value))} aria-label={t("음악 볼륨")} />
              </div>
              <div className="ocean-switch">
                <button type="button" aria-expanded={menu === "view"} onClick={() => setMenu(menu === "view" ? null : "view")}>
                  VIEW · {viewName.toUpperCase()}
                </button>
                {menu === "view" && (
                  <ul role="menu">
                    {VIEWS.map((v) => (
                      <li key={v}><button type="button" aria-current={v === viewName} onClick={() => { setViewName(v); oceanRef.current?.setView(v); setMenu(null); }}>{v}</button></li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="ocean-switch">
                <button type="button" aria-expanded={menu === "color"} onClick={() => setMenu(menu === "color" ? null : "color")}>
                  COLOR · {colorName.toUpperCase()}
                </button>
                {menu === "color" && (
                  <ul role="menu">
                    {WATER_COLORS.map((c) => (
                      <li key={c}><button type="button" aria-current={c === colorName} onClick={() => { setColorName(c); oceanRef.current?.setWaterPreset(c); setMenu(null); }}>{c}</button></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="ocean-live" aria-label={t("서울 현재 시각과 날씨")}>
              <b>{now.toLocaleTimeString(locale === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}</b>
              <i>SEOUL{weather ? ` · ${WEATHER_LABELS[weather.label]?.[locale] ?? weather.label.toUpperCase()}` : ""}</i>
            </div>
          </div>

          <motion.div className="ocean-veil" initial={false} animate={{ opacity: ready ? 0 : 1 }} transition={{ duration: reduced ? 0.1 : 0.9, ease }}>
            <p>LOADING OCEAN<span className="ocean-dots"><i>.</i><i>.</i><i>.</i></span></p>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>,
    document.body,
  );
}
