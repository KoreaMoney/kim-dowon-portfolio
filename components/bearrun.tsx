"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, FlagIcon, PersonSimpleRunIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BearBubble, BlueBear } from "@/components/bluebear";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const W = 640;
const H = 420;
const LEVEL_W = 2300;
const GROUND_TOP = 352;
const RUN_SPEED = 4.6;
const JUMP_V = -13;
const GRAVITY = .7;
const PW = 20;
const PH = 34;
const FLAG_X = 2240;
const SPARK_COLORS = ["#8fc3ff", "#5ee8a2", "#ffffff", "#4aa3ff", "#ffd166"];
const CHIP_COLLECT = 12;

type Plat = { x: number; y: number; w: number; h: number };
type Chip = { x: number; y: number; label: string; got: boolean };
type Bug = { x: number; minX: number; maxX: number; spd: number; dir: 1 | -1; dead: boolean; deadAt: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type Runner = { x: number; y: number; vx: number; vy: number; grounded: boolean; hearts: number; invUntil: number };

type RunState = {
  p: Runner;
  chips: Chip[];
  bugs: Bug[];
  camX: number;
  cpX: number;
  keys: Set<string>;
  sparks: Spark[];
  lastBurst: number;
};

const platforms: Plat[] = [
  { x: 0, y: GROUND_TOP, w: 480, h: 80 },
  { x: 540, y: GROUND_TOP, w: 340, h: 80 },
  { x: 1000, y: GROUND_TOP, w: 330, h: 80 },
  { x: 1420, y: GROUND_TOP, w: 320, h: 80 },
  { x: 1850, y: GROUND_TOP, w: 450, h: 80 },
  { x: 230, y: 280, w: 90, h: 14 },
  { x: 400, y: 230, w: 80, h: 14 },
  { x: 620, y: 290, w: 90, h: 14 },
  { x: 790, y: 236, w: 80, h: 14 },
  { x: 1020, y: 282, w: 90, h: 14 },
  { x: 1170, y: 224, w: 80, h: 14 },
  { x: 1420, y: 284, w: 90, h: 14 },
  { x: 1560, y: 230, w: 80, h: 14 },
  { x: 1840, y: 278, w: 90, h: 14 },
  { x: 1980, y: 230, w: 80, h: 14 },
];

const chipDefs = [
  { x: 270, y: 250, label: "PERF" }, { x: 435, y: 200, label: "UI" }, { x: 660, y: 260, label: "DX" },
  { x: 825, y: 206, label: "TEST" }, { x: 960, y: 310, label: "EDGE" }, { x: 1060, y: 252, label: "AGENT" },
  { x: 1205, y: 194, label: "SSR" }, { x: 1460, y: 254, label: "A11Y" }, { x: 1595, y: 200, label: "CACHE" },
  { x: 1700, y: 318, label: "AI" }, { x: 1880, y: 248, label: "API" }, { x: 2015, y: 200, label: "STATE" },
];

const bugDefs = [
  { x: 600, minX: 560, maxX: 830, spd: 1.3 },
  { x: 1100, minX: 1030, maxX: 1280, spd: 1.5 },
  { x: 1500, minX: 1460, maxX: 1700, spd: 1.2 },
  { x: 1900, minX: 1880, maxX: 2120, spd: 1.6 },
];

function freshRun(): RunState {
  return {
    p: { x: 50, y: GROUND_TOP - PH, vx: 0, vy: 0, grounded: true, hearts: 3, invUntil: 0 },
    chips: chipDefs.map((c) => ({ ...c, got: false })),
    bugs: bugDefs.map((b) => ({ ...b, dir: 1 as const, dead: false, deadAt: 0 })),
    camX: 0,
    cpX: 50,
    keys: new Set(),
    sparks: [],
    lastBurst: 0,
  };
}

function burst(x: number, y: number, sparks: Spark[]) {
  for (let i = 0; i < 46; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 3.4;
    const life = 55 + Math.random() * 40;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, color: SPARK_COLORS[i % SPARK_COLORS.length], size: 1.5 + Math.random() * 2 });
  }
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function drawBear(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, t: number, moving: boolean) {
  const bob = moving ? Math.sin(t / 90) * 1.6 : Math.sin(t / 400) * 1;
  const bodyY = y + bob;
  ctx.fillStyle = "#4aa3ff";
  ctx.strokeStyle = "#4aa3ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 11, bodyY + 8, 22, PH - 8, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, bodyY + 4, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 6.5, bodyY - 4, 3.6, 0, Math.PI * 2);
  ctx.arc(x + 6.5, bodyY - 4, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#071b32";
  ctx.beginPath();
  ctx.arc(x - 6.5, bodyY - 4, 1.7, 0, Math.PI * 2);
  ctx.arc(x + 6.5, bodyY - 4, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + dir * 3.5, bodyY + 3, 1.6, 0, Math.PI * 2);
  ctx.arc(x + dir * 8.5, bodyY + 3, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBug(ctx: CanvasRenderingContext2D, b: Bug, now: number) {
  const squish = b.dead ? Math.min((now - b.deadAt) / 240, 1) : 0;
  const h = 16 * (1 - squish * .75);
  const y = GROUND_TOP - h;
  ctx.globalAlpha = b.dead ? 1 - squish : 1;
  ctx.fillStyle = "#b0524a";
  ctx.beginPath();
  ctx.roundRect(b.x - 12, y, 24, h, 6);
  ctx.fill();
  if (!b.dead) {
    ctx.strokeStyle = "#b0524a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 5, y + 2); ctx.lineTo(b.x - 8, y - 5);
    ctx.moveTo(b.x + 5, y + 2); ctx.lineTo(b.x + 8, y - 5);
    ctx.stroke();
    ctx.fillStyle = "#071b32";
    ctx.beginPath();
    ctx.arc(b.x + b.dir * 5, y + 6, 2, 0, Math.PI * 2);
    ctx.arc(b.x + b.dir * 10, y + 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFrame(ctx: CanvasRenderingContext2D, g: RunState, now: number, en: boolean, phase: string) {
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  const cam = g.camX;
  ctx.strokeStyle = "rgba(143,195,255,.07)";
  ctx.lineWidth = 1;
  const gridOff = cam % 32;
  for (let x = -gridOff; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.fillStyle = "#0d2949";
  for (const hill of [140, 620, 1160, 1680, 2160]) {
    const hx = hill - cam * .45;
    if (hx > -140 && hx < W + 140) {
      ctx.beginPath();
      ctx.ellipse(hx, GROUND_TOP + 8, 110, 60, 0, Math.PI, 0);
      ctx.fill();
    }
  }
  for (const plat of platforms) {
    const px = plat.x - cam;
    if (px + plat.w < -8 || px > W + 8) continue;
    const isGround = plat.h > 20;
    ctx.fillStyle = isGround ? "#0e2a4a" : "#14436f";
    ctx.fillRect(px, plat.y, plat.w, plat.h);
    ctx.fillStyle = isGround ? "#2a5a8f" : "#3d7ec9";
    ctx.fillRect(px, plat.y, plat.w, 3);
  }
  for (const chip of g.chips) {
    if (chip.got) continue;
    const cx = chip.x - cam;
    if (cx < -20 || cx > W + 20) continue;
    const hover = Math.sin(now / 300 + chip.x) * 3;
    ctx.fillStyle = "#0d2949";
    ctx.strokeStyle = "#5ee8a2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 11, chip.y + hover - 9, 22, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5ee8a2";
    ctx.font = "700 6.5px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(chip.label, cx, chip.y + hover + 2);
  }
  for (const bug of g.bugs) {
    if (bug.dead && now - bug.deadAt > 400) continue;
    const bx = bug.x - cam;
    if (bx < -30 || bx > W + 30) continue;
    drawBug(ctx, { ...bug, x: bx }, now);
  }
  const fx = FLAG_X - cam;
  if (fx > -20 && fx < W + 20) {
    ctx.strokeStyle = "#8ea9c1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_TOP - 108); ctx.lineTo(fx, GROUND_TOP);
    ctx.stroke();
    ctx.fillStyle = "#0b63ce";
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_TOP - 108);
    ctx.lineTo(fx + 34, GROUND_TOP - 96);
    ctx.lineTo(fx, GROUND_TOP - 84);
    ctx.fill();
  }
  for (const spark of g.sparks) {
    ctx.globalAlpha = Math.max(spark.life / spark.maxLife, 0);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x - cam * 0, spark.y, spark.size, spark.size);
  }
  ctx.globalAlpha = 1;
  const blink = now < g.p.invUntil && Math.floor(now / 80) % 2 === 0;
  if (!blink) {
    const dir = (g.p.vx >= 0 ? 1 : -1) as 1 | -1;
    drawBear(ctx, g.p.x - cam, g.p.y, dir, now, Math.abs(g.p.vx) > .4 && g.p.grounded);
  }
  ctx.fillStyle = "#8ea9c1";
  ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("♥".repeat(Math.max(g.p.hearts, 0)) || "—", 16, 24);
  ctx.fillStyle = "#5ee8a2";
  const got = g.chips.filter((c) => c.got).length;
  ctx.fillText(`SKILLS ${got}/${CHIP_COLLECT}`, 16, 40);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8ea9c1";
  ctx.fillText(`MAP ${Math.min(Math.round(g.p.x / FLAG_X * 100), 100)}%`, W - 16, 24);
  ctx.textAlign = "center";
  if (phase === "ready") {
    ctx.fillStyle = "#8ea9c1";
    ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(en ? "find who planted the flag" : "플래그를 꽂은 주인을 찾아보세요", W / 2, H - 16);
  }
}

export function BearRun({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<RunState>(freshRun());
  const phaseRef = useRef<"ready" | "run" | "won" | "lost">("ready");
  const [phase, setPhase] = useState<"ready" | "run" | "won" | "lost">("ready");
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startGame = () => {
    gameRef.current = freshRun();
    setShowPromo(false);
    setPhase("run");
  };

  const tryJump = () => {
    const g = gameRef.current;
    if (phaseRef.current !== "run") return;
    if (g.p.grounded) { g.p.vy = JUMP_V; g.p.grounded = false; }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key)) { gameRef.current.keys.add(key); event.preventDefault(); }
      if (key === "ArrowUp" || key === "w" || key === " ") { tryJump(); event.preventDefault(); }
    };
    const keyUp = (event: KeyboardEvent) => {
      gameRef.current.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    };
    const onDown = () => tryJump();
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    drawFrame(ctx, gameRef.current, performance.now(), en, "ready");
  }, [en]);

  useEffect(() => {
    if (phase !== "run" && phase !== "won") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const step = (now: number) => {
      const g = gameRef.current;
      const p = g.p;
      if (phase === "run") {
        const move = (g.keys.has("ArrowRight") || g.keys.has("d") ? 1 : 0) - (g.keys.has("ArrowLeft") || g.keys.has("a") ? 1 : 0);
        p.vx = move ? Math.min(Math.max(p.vx + move * .9, -RUN_SPEED), RUN_SPEED) : p.vx * .82;
        if (Math.abs(p.vx) < .2) p.vx = 0;
        p.x += p.vx;
        p.x = Math.min(Math.max(p.x, 12), LEVEL_W - 12);
        const prevY = p.y;
        p.vy += GRAVITY;
        p.y += p.vy;
        p.grounded = false;
        for (const plat of platforms) {
          if (!overlaps(p.x - PW / 2, p.y, PW, PH, plat.x, plat.y, plat.w, plat.h)) continue;
          if (p.vy >= 0 && prevY + PH <= plat.y + 8) {
            p.y = plat.y - PH;
            p.vy = 0;
            p.grounded = true;
          } else if (p.vy < 0 && prevY >= plat.y + plat.h - 6) {
            p.y = plat.y + plat.h;
            p.vy = 0;
          } else {
            const push = p.x < plat.x + plat.w / 2 ? plat.x - PW / 2 : plat.x + plat.w + PW / 2;
            p.x = push;
            p.vx = 0;
          }
        }
        if (p.grounded) g.cpX = p.x;
        for (const chip of g.chips) {
          if (chip.got) continue;
          if (overlaps(p.x - PW / 2 - 4, p.y - 4, PW + 8, PH + 8, chip.x - 12, chip.y - 10, 24, 20)) chip.got = true;
        }
        for (const bug of g.bugs) {
          if (bug.dead) continue;
          bug.x += bug.dir * bug.spd;
          if (bug.x > bug.maxX) { bug.x = bug.maxX; bug.dir = -1; }
          if (bug.x < bug.minX) { bug.x = bug.minX; bug.dir = 1; }
          if (!overlaps(p.x - PW / 2, p.y, PW, PH, bug.x - 12, GROUND_TOP - 16, 24, 16)) continue;
          if (p.vy > 1 && p.y + PH < GROUND_TOP - 4) {
            bug.dead = true;
            bug.deadAt = now;
            p.vy = -9;
            p.grounded = false;
          } else if (now >= p.invUntil) {
            p.hearts -= 1;
            p.invUntil = now + 1300;
            p.vx = (p.x < bug.x ? -1 : 1) * 6;
            p.vy = -6;
            if (p.hearts <= 0) setPhase("lost");
          }
        }
        if (p.y > H + 40) {
          p.hearts -= 1;
          if (p.hearts <= 0) {
            setPhase("lost");
          } else {
            p.x = g.cpX;
            p.y = 60;
            p.vx = 0;
            p.vy = 0;
            p.invUntil = now + 1500;
          }
        }
        if (p.x >= FLAG_X) setPhase("won");
      }
      if (phase === "won" && !reduced) {
        if (now - g.lastBurst > 340) {
          g.lastBurst = now;
          burst(70 + Math.random() * (W - 140), 50 + Math.random() * 190, g.sparks);
        }
        for (const spark of g.sparks) {
          spark.x += spark.vx; spark.y += spark.vy; spark.vy += .045; spark.vx *= .985; spark.life -= 1;
        }
        g.sparks = g.sparks.filter((spark) => spark.life > 0);
      }
      g.camX = Math.min(Math.max(p.x - W * .38, 0), LEVEL_W - W);
      drawFrame(ctx, g, now, en, phase);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, en, reduced]);

  useEffect(() => {
    if (phase !== "won") return;
    const timer = window.setTimeout(() => setShowPromo(true), reduced ? 300 : 1400);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const commentary = phase === "won"
    ? (en ? "The flag's owner is… Kim Dowon, of course. You collected his skill chips on the way." : "플래그의 주인은… 역시 김도원입니다. 오는 길에 그의 스킬 칩을 주웠으니까요.")
    : phase === "lost"
      ? (en ? "The bugs got you this time. Watch the gaps and stomp from above." : "이번엔 버그들에게 졌네요. 갭을 조심하고 위에서 밟아보세요.")
      : phase === "run"
        ? (en ? "Move: arrows·A/D. Jump: ↑·W·Space. Stomp bugs, grab skill chips, reach the flag." : "이동: 방향키·A/D. 점프: ↑·W·스페이스. 버그를 밟고, 스킬 칩을 모아 플래그까지 가세요.")
        : (en ? "A side-scrolling run. 3 hearts, 12 skill chips, one flag — and a secret at the end." : "횡스크롤 런입니다. 하트 3개, 스킬 칩 12개, 그리고 끝의 플래그 — 비밀이 하나 있습니다.");

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">{en ? "BEAR RUN" : "베어 런"}</span>
          <span className="wc-hud-match">{en ? "REACH THE FLAG" : "플래그까지 도달"}</span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "Bear run platformer canvas" : "베어 런 플랫폼 게임 캔버스"} role="img" />
          {phase === "ready" && (
            <div className="bb-overlay">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">BEAR RUN</span>
              <h2>{en ? "Run to the flag." : "플래그까지 달려라."}</h2>
              <p>{en ? "Move: arrows·A/D. Jump: ↑·W·Space or tap. Stomp bugs from above, collect 12 skill chips." : "이동: 방향키·A/D. 점프: ↑·W·스페이스 또는 탭. 버그는 위에서 밟고, 스킬 칩 12개를 모으세요."}</p>
              <Button type="button" onClick={startGame}>{en ? "Run" : "달리기"} <PersonSimpleRunIcon size={17} /></Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="bb-overlay">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">GAME OVER</span>
              <h2>{en ? "Out of hearts." : "하트를 다 썼습니다."}</h2>
              <p>{en ? "The flag is still out there. Try again — stomp bugs, don't hug them." : "플래그는 아직 저기 있습니다. 다시 도전하세요 — 버그는 밟는 거지 껴안는 게 아닙니다."}</p>
              <Button type="button" onClick={startGame}><ArrowCounterClockwiseIcon size={17} /> {en ? "Run again" : "다시 달리기"}</Button>
            </div>
          )}
          {showPromo && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">FLAG CAPTURED</span>
              <h2>{en ? "The flag's owner is… Kim Dowon." : "플래그의 주인은… 김도원."}</h2>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended. (He runs fast too.)" : "김도원 추천합니다. (달리기도 잘합니다.)"}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={startGame}><FlagIcon size={17} /> {en ? "Run again" : "다시 달리기"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
        </div>
        {phase === "run" && (
          <div className="sf-controls">
            <div className="sf-row">
              <button type="button" aria-label={en ? "Move left" : "왼쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowLeft")} onPointerUp={() => gameRef.current.keys.delete("ArrowLeft")} onPointerLeave={() => gameRef.current.keys.delete("ArrowLeft")}>◀</button>
              <button type="button" aria-label={en ? "Jump" : "점프"} onPointerDown={() => tryJump()}>▲</button>
              <button type="button" aria-label={en ? "Move right" : "오른쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowRight")} onPointerUp={() => gameRef.current.keys.delete("ArrowRight")} onPointerLeave={() => gameRef.current.keys.delete("ArrowRight")}>▶</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
