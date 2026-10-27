"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, FlagIcon, HeartIcon, PersonSimpleRunIcon } from "@phosphor-icons/react";
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
  hurtAt: number;
  keys: Set<string>;
  sparks: Spark[];
  lastBurst: number;
  plane: { x: number; active: boolean };
  planesSeen: number;
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
    hurtAt: 0,
    keys: new Set(),
    sparks: [],
    lastBurst: 0,
    plane: { x: 0, active: false },
    planesSeen: 0,
  };
}

function burst(x: number, y: number, sparks: Spark[], count = 46, color?: string) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 3.4;
    const life = 55 + Math.random() * 40;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, color: color ?? SPARK_COLORS[i % SPARK_COLORS.length], size: 1.5 + Math.random() * 2 });
  }
}

function overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function drawBear(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, t: number, moving: boolean, airborne: boolean) {
  const run = Math.sin(t / 80);
  const bob = airborne ? 0 : moving ? -Math.abs(run) * 2 : Math.sin(t / 400);
  const outline = "#0a2240";
  const fur = "#2f7fe0";
  const inner = "#78b7ff";
  const face = "#eaf4ff";
  const muzzle = "#9cc4ef";
  const footY = y + PH - 3;
  const kick = airborne ? 2.5 : moving ? run * 4 : 0;
  ctx.fillStyle = "#1d5cb8";
  ctx.beginPath();
  ctx.ellipse(x - 6 - kick, footY - (airborne ? 4 : 0), 4.6, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 6 + kick, footY, 4.6, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const bodyTop = y + 14 + bob;
  ctx.fillStyle = fur;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 10.5, bodyTop, 21, PH - 16 - bob, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.roundRect(x - 5.5, bodyTop + 9, 11, PH - 27 - bob, 5);
  ctx.fill();
  const armSwing = moving && !airborne ? -run * 5 : 0;
  ctx.fillStyle = fur;
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.ellipse(x + dir * 10, bodyTop + 10 + armSwing * .4, 3.4, 6, dir * .35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - dir * 10.5, bodyTop + 12 - armSwing * .4, 3, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const hy = y + 9 + bob * 1.2;
  ctx.fillStyle = fur;
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.arc(x - 7, hy - 7, 4.6, 0, Math.PI * 2);
  ctx.arc(x + 7, hy - 7, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(x - 7, hy - 7, 2.3, 0, Math.PI * 2);
  ctx.arc(x + 7, hy - 7, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fur;
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.arc(x, hy, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = muzzle;
  ctx.beginPath();
  ctx.ellipse(x + dir * 2.5, hy + 4.5, 5.6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x - 3.8 + dir * 1.5, hy - 2.6, 2.3, 0, Math.PI * 2);
  ctx.arc(x + 3.8 + dir * 1.5, hy - 2.6, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#071b32";
  ctx.beginPath();
  ctx.arc(x - 3.8 + dir * 2.2, hy - 2.4, 1.1, 0, Math.PI * 2);
  ctx.arc(x + 3.8 + dir * 2.2, hy - 2.4, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.roundRect(x + dir * 2.5 - 2, hy + 2.2, 4, 2.4, 1.2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + dir * 2.5 - 3.4, hy + 6.4);
  ctx.quadraticCurveTo(x + dir * 2.5, hy + 8.4, x + dir * 2.5 + 3.4, hy + 6.4);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,150,160,.35)";
  ctx.beginPath();
  ctx.arc(x - 6.8, hy + 2.6, 1.9, 0, Math.PI * 2);
  ctx.arc(x + 6.8, hy + 2.6, 1.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawBug(ctx: CanvasRenderingContext2D, b: Bug, now: number) {
  const squish = b.dead ? Math.min((now - b.deadAt) / 240, 1) : 0;
  const h = 17 * (1 - squish * .72);
  const y = GROUND_TOP - h;
  ctx.globalAlpha = b.dead ? 1 - squish : 1;
  if (!b.dead) {
    ctx.strokeStyle = "#8a3f39";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    for (let l = 0; l < 3; l += 1) {
      const wig = Math.sin(now / 70 + l * 2.1) * 2.6;
      ctx.beginPath();
      ctx.moveTo(b.x - 6 + l * 6, y + h - 4);
      ctx.lineTo(b.x - 9 + l * 6 + wig, GROUND_TOP + 1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(b.x - 4, y + 3); ctx.lineTo(b.x - 8, y - 6);
    ctx.moveTo(b.x + 4, y + 3); ctx.lineTo(b.x + 8, y - 6);
    ctx.stroke();
    ctx.fillStyle = "#ff8a7a";
    ctx.beginPath();
    ctx.arc(b.x - 8, y - 6, 1.6, 0, Math.PI * 2);
    ctx.arc(b.x + 8, y - 6, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#c05a52";
  ctx.strokeStyle = "#6e2f2a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(b.x - 12, y, 24, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7c352f";
  ctx.fillRect(b.x - 12, y + h * .55, 24, 1.5);
  if (!b.dead) {
    ctx.fillStyle = "#ffd9d4";
    ctx.beginPath();
    ctx.arc(b.x + b.dir * 4, y + 5, 2.2, 0, Math.PI * 2);
    ctx.arc(b.x + b.dir * 9, y + 5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#071b32";
    ctx.beginPath();
    ctx.arc(b.x + b.dir * 4.6, y + 5, 1, 0, Math.PI * 2);
    ctx.arc(b.x + b.dir * 9.6, y + 5, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFrame(ctx: CanvasRenderingContext2D, g: RunState, now: number, en: boolean, phase: string) {
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (now - g.hurtAt < 320) ctx.translate((Math.random() - .5) * 5, (Math.random() - .5) * 5);
  const cam = g.camX;
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_TOP);
  sky.addColorStop(0, "#04101f");
  sky.addColorStop(1, "#0b2547");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_TOP + 2);
  ctx.fillStyle = "rgba(200,220,255,.5)";
  for (let s = 0; s < 40; s += 1) {
    const sx = (s * 137.5) % LEVEL_W - cam * .15;
    const sy = 18 + ((s * 89) % 150);
    if (sx > -4 && sx < W + 4) ctx.fillRect(sx, sy, 1.4, 1.4);
  }
  for (const [cx0, cy] of [[180, 62], [700, 96], [1250, 54], [1800, 88], [2240, 66]] as [number, number][]) {
    const cxx = cx0 - cam * .3;
    if (cxx < -80 || cxx > W + 80) continue;
    ctx.fillStyle = "rgba(143,195,255,.09)";
    ctx.beginPath();
    ctx.ellipse(cxx, cy, 34, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(cxx + 18, cy + 5, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
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
    ctx.beginPath();
    ctx.roundRect(px, plat.y, plat.w, plat.h, isGround ? 4 : 7);
    ctx.fill();
    ctx.fillStyle = isGround ? "#2a5a8f" : "#3d7ec9";
    ctx.beginPath();
    ctx.roundRect(px, plat.y, plat.w, 4, [4, 4, 0, 0]);
    ctx.fill();
    if (!isGround) {
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.roundRect(px + 3, plat.y + plat.h - 3, plat.w - 6, 3, 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(143,195,255,.14)";
      for (let tx = px + 18; tx < px + plat.w - 10; tx += 46) {
        ctx.fillRect(tx, plat.y + 10, 8, 2);
      }
    }
  }
  for (const chip of g.chips) {
    if (chip.got) continue;
    const cx = chip.x - cam;
    if (cx < -20 || cx > W + 20) continue;
    const hover = Math.sin(now / 300 + chip.x) * 3;
    ctx.shadowColor = "#5ee8a2";
    ctx.shadowBlur = 9;
    ctx.fillStyle = "#0d2949";
    ctx.strokeStyle = "#5ee8a2";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - 11, chip.y + hover - 9, 22, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
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
    ctx.fillStyle = "#2a5a8f";
    ctx.beginPath();
    ctx.ellipse(fx, GROUND_TOP, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8ea9c1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_TOP - 108); ctx.lineTo(fx, GROUND_TOP);
    ctx.stroke();
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(fx, GROUND_TOP - 110, 3.4, 0, Math.PI * 2);
    ctx.fill();
    const wave = Math.sin(now / 180) * 5;
    ctx.fillStyle = "#0b63ce";
    ctx.beginPath();
    ctx.moveTo(fx, GROUND_TOP - 108);
    ctx.quadraticCurveTo(fx + 20, GROUND_TOP - 100 + wave, fx + 36 + wave * .6, GROUND_TOP - 96);
    ctx.lineTo(fx, GROUND_TOP - 84);
    ctx.fill();
    ctx.fillStyle = "#5ee8a2";
    ctx.font = "700 8px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("★", fx + 14, GROUND_TOP - 95);
  }
  for (const spark of g.sparks) {
    ctx.globalAlpha = Math.max(spark.life / spark.maxLife, 0);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x - cam, spark.y, spark.size, spark.size);
  }
  ctx.globalAlpha = 1;
  const blink = now < g.p.invUntil && Math.floor(now / 80) % 2 === 0;
  if (!blink) {
    const dir = (g.p.vx >= 0 ? 1 : -1) as 1 | -1;
    drawBear(ctx, g.p.x - cam, g.p.y, dir, now, Math.abs(g.p.vx) > .4 && g.p.grounded, !g.p.grounded);
  }
  ctx.fillStyle = "#ff6b5a";
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
  if (g.plane.active) {
    const px = g.plane.x - cam;
    const py = 62 + Math.sin(now / 260) * 4;
    const bannerText = en ? "Product · Business · Communication — Kim Dowon, recommended." : "제품을 생각하고 기업을 생각하고 의사소통이 뛰어난 김도원 추천합니다";
    ctx.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";
    const textW = ctx.measureText(bannerText).width;
    const bw = textW + 20;
    const bh = 20;
    const bx = px - 26 - bw;
    const by = py - bh / 2 + Math.sin(now / 180 + px * .02) * 2;
    ctx.strokeStyle = "#8ea9c1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 12, py);
    ctx.lineTo(bx + bw, by + bh / 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(234,244,255,.95)";
    ctx.strokeStyle = "#2a5a8f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#071b32";
    ctx.textAlign = "center";
    ctx.fillText(bannerText, bx + bw / 2, by + bh / 2 + 3.5);
    ctx.fillStyle = "#eaf4ff";
    ctx.strokeStyle = "#0a2240";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px - 13, py - 4, 26, 8, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#b0524a";
    ctx.beginPath();
    ctx.moveTo(px - 2, py - 4);
    ctx.lineTo(px + 4, py - 12);
    ctx.lineTo(px + 9, py - 12);
    ctx.lineTo(px + 6, py - 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px - 13, py - 2);
    ctx.lineTo(px - 18, py - 7);
    ctx.lineTo(px - 15, py + 1);
    ctx.fill();
    ctx.fillStyle = "#4aa3ff";
    ctx.beginPath();
    ctx.arc(px + 7, py - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#eaf4ff";
    ctx.lineWidth = 1.2;
    const propA = now / 30;
    ctx.beginPath();
    ctx.moveTo(px + 14, py + Math.sin(propA) * 6);
    ctx.lineTo(px + 14, py - Math.sin(propA) * 6);
    ctx.stroke();
  }
  ctx.restore();
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

  const continueRun = () => {
    const g = gameRef.current;
    g.p.hearts = 3;
    g.p.x = g.cpX;
    g.p.y = 60;
    g.p.vx = 0;
    g.p.vy = 0;
    g.p.invUntil = performance.now() + 1500;
    setPhase("run");
  };

  const tryJump = () => {
    const g = gameRef.current;
    if (phaseRef.current !== "run") return;
    if (g.p.grounded) {
      g.p.vy = JUMP_V;
      g.p.grounded = false;
      burst(g.p.x, GROUND_TOP, g.sparks, 6, "#8fc3ff");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const keyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== "run") return;
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
        if (p.grounded) {
          g.cpX = p.x;
          if (Math.abs(p.vx) > 3 && Math.floor(now / 90) % 2 === 0) {
            g.sparks.push({ x: p.x - Math.sign(p.vx) * 10, y: GROUND_TOP - 2, vx: -p.vx * .15, vy: -1 - Math.random(), life: 16, maxLife: 16, color: "#315372", size: 2 + Math.random() * 2 });
          }
        }
        for (const chip of g.chips) {
          if (chip.got) continue;
          if (overlaps(p.x - PW / 2 - 4, p.y - 4, PW + 8, PH + 8, chip.x - 12, chip.y - 10, 24, 20)) {
            chip.got = true;
            burst(chip.x, chip.y, g.sparks, 10, "#5ee8a2");
            const got = g.chips.filter((c) => c.got).length;
            if (got % 4 === 0 && got > g.planesSeen * 4 && !g.plane.active) {
              g.planesSeen = got / 4;
              g.plane = { x: g.camX - 420, active: true };
            }
          }
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
            burst(bug.x, GROUND_TOP - 16, g.sparks, 12, "#b0524a");
            g.hurtAt = now;
          } else if (now >= p.invUntil) {
            p.hearts -= 1;
            p.invUntil = now + 1300;
            p.vx = (p.x < bug.x ? -1 : 1) * 6;
            p.vy = -6;
            g.hurtAt = now;
            burst(p.x, p.y + 14, g.sparks, 14, "#ff6b5a");
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
            g.hurtAt = now;
            burst(p.x, p.y + 20, g.sparks, 10, "#8fc3ff");
          }
        }
        if (g.plane.active) {
          g.plane.x += 1.7;
          if (g.plane.x > g.camX + W + 480) g.plane.active = false;
        }
        if (p.x >= FLAG_X) setPhase("won");
      }
      if (phase === "won" && !reduced) {
        if (now - g.lastBurst > 340) {
          g.lastBurst = now;
          burst(g.camX + 70 + Math.random() * (W - 140), 50 + Math.random() * 190, g.sparks);
        }
      }
      for (const spark of g.sparks) {
        spark.x += spark.vx; spark.y += spark.vy; spark.vy += .045; spark.vx *= .985; spark.life -= 1;
      }
      g.sparks = g.sparks.filter((spark) => spark.life > 0);
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
            <div className="bb-overlay bb-promo">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">OUT OF HEARTS</span>
              <h2>{en ? "Hearts empty." : "하트 소진."}</h2>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b><br />
                {en ? "(He'll refill your hearts.)" : "(하트는 김도원이 채워줍니다.)"}
              </p>
              <div className="bb-promo-actions">
                <Button type="button" onClick={continueRun}><HeartIcon size={17} /> {en ? "Recharge & continue" : "하트 재충전"}</Button>
                <Button type="button" variant="secondary" onClick={startGame}><ArrowCounterClockwiseIcon size={17} /> {en ? "From the top" : "처음부터"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
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
            <div className="sf-row sf-row--run">
              <button type="button" aria-label={en ? "Move left" : "왼쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowLeft")} onPointerUp={() => gameRef.current.keys.delete("ArrowLeft")} onPointerLeave={() => gameRef.current.keys.delete("ArrowLeft")}>◀</button>
              <button type="button" aria-label={en ? "Move right" : "오른쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowRight")} onPointerUp={() => gameRef.current.keys.delete("ArrowRight")} onPointerLeave={() => gameRef.current.keys.delete("ArrowRight")}>▶</button>
              <button type="button" aria-label={en ? "Jump" : "점프"} onPointerDown={() => tryJump()}>{en ? "JUMP ▲" : "점프 ▲"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
