"use client";

import {
  ArrowCounterClockwiseIcon, ArrowRightIcon, BooksIcon, BracketsCurlyIcon, ChartBarIcon,
  ChatCircleDotsIcon, CheckIcon, CubeIcon, DeviceMobileIcon, FactoryIcon, LightningIcon,
  MagnifyingGlassIcon, PackageIcon, RobotIcon, ShareNetworkIcon, ShieldCheckIcon, SunIcon,
  TranslateIcon, TrophyIcon, UsersIcon, WrenchIcon, type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  analysisSteps, bearLines, candidates, fallbackVerdict, stageKeyOf, stageLabel,
  type Candidate,
} from "@/lib/worldcup/data";

const candidateIcons: Record<string, Icon> = {
  perf: LightningIcon, talk: ChatCircleDotsIcon, agent: RobotIcon, verify: ShieldCheckIcon,
  twin: CubeIcon, tool: WrenchIcon, field: FactoryIcon, morning: SunIcon,
  dig: MagnifyingGlassIcon, clean: BracketsCurlyIcon, mobile: DeviceMobileIcon, data: ChartBarIcon,
  babel: TranslateIcon, paper: BooksIcon, oneman: UsersIcon, product: PackageIcon,
};

type Phase = "intro" | "play" | "analyzing";

function BlueBear({ mood = "happy", className = "" }: { mood?: "happy" | "shocked" | "smug"; className?: string }) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" focusable="false" className={`wc-bear ${className}`}>
      <circle className="wc-bear-ear" cx="20" cy="15" r="10" />
      <circle className="wc-bear-ear" cx="60" cy="15" r="10" />
      <circle className="wc-bear-inner-ear" cx="20" cy="15" r="5" />
      <circle className="wc-bear-inner-ear" cx="60" cy="15" r="5" />
      <path className="wc-bear-head" d="M12 20q28 -8 56 0v30q0 16 -16 16H28q-16 0 -16 -16z" />
      <rect className="wc-bear-eye" x="25" y="34" width="6" height={mood === "shocked" ? 9 : 6} />
      <rect className="wc-bear-eye" x="49" y="34" width="6" height={mood === "shocked" ? 9 : 6} />
      <ellipse className="wc-bear-muzzle" cx="40" cy="50" rx="11" ry="8" />
      <rect className="wc-bear-nose" x="37" y="44" width="6" height="4" />
      {mood === "shocked"
        ? <rect className="wc-bear-mouth" x="36" y="52" width="8" height="5" />
        : <path className="wc-bear-mouth" d="m34 51 6 4 6 -4" />}
      {mood === "smug" && <path className="wc-bear-brow" d="m23 30 10 -3m24 1 -10 -1" />}
    </svg>
  );
}

function BearBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="wc-bubble-row">
      <BlueBear className="wc-bubble-bear" />
      <div className="wc-bubble"><span>푸른곰 · BLUEBEAR AI</span><p>{children}</p></div>
    </div>
  );
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function WorldCup() {
  const { locale } = useLocale();
  return <LocalizedWorldCup key={locale} />;
}

function LocalizedWorldCup() {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("intro");
  const [pool, setPool] = useState<Candidate[]>([]);
  const [round, setRound] = useState<Candidate[]>([]);
  const [nextRound, setNextRound] = useState<Candidate[]>([]);
  const [picks, setPicks] = useState<Candidate[]>([]);
  const [eliminated, setEliminated] = useState<Candidate[]>([]);
  const [champion, setChampion] = useState<Candidate | null>(null);
  const [verdict, setVerdict] = useState("");
  const [verdictSource, setVerdictSource] = useState<"ai" | "portfolio">("portfolio");
  const [verdictReady, setVerdictReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [locked, setLocked] = useState(false);
  const fetchStarted = useRef(false);

  const stageSize = round.length + nextRound.length;
  const stage = stageKeyOf(stageSize || 8);
  const matchTotal = stageSize / 2;
  const matchNo = matchTotal - round.length / 2 + 1;
  const pair = round.slice(0, 2) as [Candidate, Candidate];
  const line = useMemo(() => {
    const lines = bearLines[locale][stage];
    return lines[(matchNo - 1) % lines.length];
  }, [locale, stage, matchNo]);
  const steps = analysisSteps[locale];
  const progress = pool.length ? picks.length / (pool.length - 1) : 0;

  const start = (size: 8 | 16) => {
    const selected = shuffle(candidates).slice(0, size);
    setPool(candidates.filter((candidate) => selected.includes(candidate)));
    setRound(selected);
    setNextRound([]);
    setPicks([]);
    setEliminated([]);
    setChampion(null);
    setVerdict("");
    setVerdictReady(false);
    setStepIndex(0);
    setCopied(false);
    fetchStarted.current = false;
    setPhase("play");
  };

  const pick = (winner: Candidate) => {
    if (!pair[0] || !pair[1] || phase !== "play" || locked) return;
    setLocked(true);
    window.setTimeout(() => setLocked(false), 240);
    const loser = pair[0] === winner ? pair[1] : pair[0];
    const rest = round.slice(2);
    const winners = [...nextRound, winner];
    setPicks((prev) => [...prev, winner]);
    setEliminated((prev) => [...prev, loser]);
    if (rest.length === 0) {
      if (winners.length === 1) {
        setChampion(winner);
        setRound([]);
        setPhase("analyzing");
      } else {
        setRound(winners);
        setNextRound([]);
      }
    } else {
      setRound(rest);
      setNextRound(winners);
    }
  };

  useEffect(() => {
    if (phase !== "analyzing" || fetchStarted.current) return;
    fetchStarted.current = true;
    fetch("/api/worldcup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: picks.map((item) => item.id), locale }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { verdict?: string; source?: "ai" | "portfolio" };
        setVerdict(data.verdict || fallbackVerdict(picks, locale));
        setVerdictSource(data.source === "ai" ? "ai" : "portfolio");
      })
      .catch(() => {
        setVerdict(fallbackVerdict(picks, locale));
        setVerdictSource("portfolio");
      })
      .finally(() => setVerdictReady(true));
  }, [phase, picks, locale]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const stepTime = reduced ? 120 : 680;
    const timers = steps.map((_, index) => window.setTimeout(() => setStepIndex(index + 1), (index + 1) * stepTime));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, steps, reduced]);

  const stepsDone = stepIndex >= steps.length;
  const showResult = phase === "analyzing" && stepsDone && verdictReady;

  const copyResult = async () => {
    const text = en
      ? `BlueBear Ideal-Type World Cup — my ideal type is Kim Dowon (match rate 100%). ${window.location.origin}/worldcup`
      : `푸른곰 이상형 월드컵 결과 — 내 이상형은 김도원 (매칭률 100%). ${window.location.origin}/worldcup`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main id="main" className="wc-page">
      {phase === "intro" && (
        <section className="wc-intro" aria-label={en ? "Ideal type world cup intro" : "이상형 월드컵 안내"}>
          <BlueBear className="wc-intro-bear" mood="smug" />
          <span className="wc-kicker">BLUEBEAR AI MATCHMAKING LAB</span>
          <h1>{en ? "Ideal Type" : "푸른곰"}<br />{en ? "World Cup" : "이상형 월드컵"}</h1>
          <p>{en
            ? "Pick your ideal developer through a bracket. BlueBear AI analyzes your choice pattern and delivers the final verdict. We take no responsibility for the result."
            : "토너먼트로 당신의 이상형 개발자를 뽑아보세요. 푸른곰 AI가 선택 패턴을 분석해 최종 판정을 내립니다. 결과는 책임지지 않습니다."}</p>
          <div className="wc-intro-actions">
            <Button type="button" onClick={() => start(8)}>{en ? "Start · Quarterfinal" : "8강으로 시작"} <TrophyIcon size={17} /></Button>
            <Button type="button" variant="secondary" onClick={() => start(16)}>{en ? "Start · Round of 16" : "16강으로 시작"} <TrophyIcon size={17} /></Button>
          </div>
          <code className="wc-intro-command"><span aria-hidden="true">$</span> run ideal-type --judge bluebear.ai</code>
        </section>
      )}

      {phase === "play" && (
        <section className="wc-stage" aria-label={en ? "Bracket match" : "토너먼트 대진"}>
          <header className="wc-hud">
            <span className="wc-hud-stage">{stageLabel[stage][locale]}</span>
            <span className="wc-hud-match">{en ? `MATCH ${matchNo}/${matchTotal}` : `${matchNo} / ${matchTotal} 경기`}</span>
            <span className="wc-hud-progress" aria-hidden="true"><i style={{ "--wc-progress": `${progress * 100}%` } as React.CSSProperties} /></span>
          </header>
          <BearBubble>{line}</BearBubble>
          <div className="wc-match">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={`${stage}-${matchNo}-${pair[0]?.id}`}
                className="wc-pair"
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: reduced ? .01 : .28, ease: [0.22, 1, 0.36, 1] }}
              >
                {pair.map((candidate) => {
                  const IconComponent = candidateIcons[candidate.id] ?? PackageIcon;
                  return (
                    <button key={candidate.id} type="button" className="wc-card" onClick={() => pick(candidate)} disabled={locked}>
                      <span className="wc-card-icon"><IconComponent size={30} /></span>
                      <strong>{candidate.alias[locale]}</strong>
                      <small>{candidate.tag[locale]}</small>
                      <em>{en ? "PICK" : "선택"}</em>
                    </button>
                  );
                })}
                <span className="wc-vs" aria-hidden="true">VS</span>
              </motion.div>
            </AnimatePresence>
          </div>
          {eliminated.length > 0 && (
            <div className="wc-elim" aria-label={en ? "Eliminated" : "탈락 후보"}>
              <span>{en ? "ELIMINATED" : "탈락"}</span>
              {eliminated.map((candidate) => <code key={candidate.id}>{candidate.alias[locale]}</code>)}
            </div>
          )}
        </section>
      )}

      {phase === "analyzing" && !showResult && (
        <section className="wc-analyzing" aria-label={en ? "Analyzing picks" : "선택 분석 중"}>
          <BlueBear mood="shocked" className="wc-analyzing-bear" />
          <span className="wc-kicker">BLUEBEAR AI · ANALYZING</span>
          <h2>{en ? "Analyzing your pick pattern…" : "당신의 선택 패턴을 분석 중…"}</h2>
          <ol className="wc-steps">
            {steps.map((step, index) => <li key={step} className={index < stepIndex ? "is-done" : ""}><i /><span>{step}</span><b>{index < stepIndex ? "DONE" : `${index + 1}/${steps.length}`}</b></li>)}
          </ol>
        </section>
      )}

      {showResult && champion && (
        <section className="wc-result" aria-label={en ? "World cup result" : "월드컵 결과"}>
          <header className="wc-result-head"><span>FINAL RESULT</span><code>{verdictSource === "ai" ? "AI VERIFIED" : "VERIFIED"}</code></header>
          <div className="wc-champion">
            <span className="wc-stamp">{en ? "IDENTITY: KIM DOWON" : "정체: 김도원"}</span>
            <BlueBear mood="smug" className="wc-champion-bear" />
            <small>{champion.alias[locale]}</small>
            <h2>{en ? "Your ideal type:" : "당신의 이상형:"}<br />{en ? "Kim Dowon" : "김도원"}</h2>
            <p className="wc-reveal-fact">{champion.reveal[locale]}</p>
          </div>
          <BearBubble>{verdict || fallbackVerdict(picks, locale)}</BearBubble>
          <div className="wc-unmask" aria-label={en ? "All candidates unmasked" : "전체 후보 정체 공개"}>
            <span>{en ? "EVERY CANDIDATE WAS…" : "모든 후보의 정체는…"}</span>
            <div>{pool.map((candidate) => <code key={candidate.id}><s>{candidate.alias[locale]}</s>{en ? "Kim Dowon" : "김도원"}</code>)}</div>
          </div>
          <div className="wc-path" aria-label={en ? "Your pick path" : "당신의 선택 경로"}>
            <span>{en ? "YOUR PICKS" : "선택 경로"}</span>
            <div>{picks.map((candidate, index) => <code key={`${candidate.id}-${index}`}>{candidate.alias[locale]}<ArrowRightIcon size={11} /></code>)}<b>{en ? "Kim Dowon" : "김도원"}</b></div>
          </div>
          <div className="wc-result-stats"><span><b>{en ? "5 yrs" : "5년"}</b>{en ? "experience" : "경력"}</span><span><b>19</b>builds</span><span><b>15s→7s</b>translation</span><span><b>100%</b>{en ? "match rate" : "매칭률"}</span></div>
          <div className="wc-result-actions">
            <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
            <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
            <Button type="button" variant="secondary" onClick={copyResult}>{copied ? <CheckIcon size={17} /> : <ShareNetworkIcon size={17} />} {copied ? (en ? "Copied" : "복사됨") : (en ? "Share result" : "결과 공유")}</Button>
            <Button type="button" variant="secondary" onClick={() => setPhase("intro")}><ArrowCounterClockwiseIcon size={17} /> {en ? "Play again" : "다시 하기"}</Button>
          </div>
        </section>
      )}
    </main>
  );
}
