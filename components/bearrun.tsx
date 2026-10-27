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
const GROUND_TOP = 352;
const RUN_SPEED = 4.6;
const JUMP_V = -13;
const GRAVITY = .7;
const PW = 20;
const PH = 34;
const MAX_LEVEL = 10;
const SPARK_COLORS = ["#8fc3ff", "#5ee8a2", "#ffffff", "#4aa3ff", "#ffd166"];
const CHIP_LABELS = ["PERF", "UI", "DX", "TEST", "AGENT", "SSR", "A11Y", "CACHE", "API", "STATE", "EDGE", "AI", "CI", "LCP", "TDD", "REALTIME", "i18n", "SEO"];

type Plat = { x: number; y: number; w: number; h: number };
type Chip = { x: number; y: number; label: string; got: boolean };
type Bug = { x: number; minX: number; maxX: number; spd: number; dir: 1 | -1; kind: number; dead: boolean; deadAt: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type Runner = { x: number; y: number; vx: number; vy: number; grounded: boolean; hearts: number; invUntil: number };
type BannerRect = { x: number; y: number; w: number; h: number; url: string };
type Difficulty = "easy" | "normal" | "hard";
type Weather = "clear" | "dawn" | "fog" | "rain" | "snow" | "leaves" | "storm" | "aurora" | "wind" | "finale";

const levelWeather: Weather[] = ["clear", "dawn", "fog", "rain", "snow", "leaves", "storm", "aurora", "wind", "finale"];
const weatherNames: Record<Weather, { ko: string; en: string }> = {
  clear: { ko: "맑은 밤", en: "Clear Night" },
  dawn: { ko: "새벽", en: "Dawn" },
  fog: { ko: "안개", en: "Fog" },
  rain: { ko: "비", en: "Rain" },
  snow: { ko: "눈", en: "Snow" },
  leaves: { ko: "낙엽 바람", en: "Falling Leaves" },
  storm: { ko: "폭풍", en: "Storm" },
  aurora: { ko: "오로라", en: "Aurora" },
  wind: { ko: "강풍", en: "Strong Wind" },
  finale: { ko: "황금 노을", en: "Golden Finale" },
};
const skies: Record<Weather, [string, string]> = {
  clear: ["#04101f", "#0b2547"],
  dawn: ["#2a1840", "#c96f45"],
  fog: ["#16283f", "#3d567a"],
  rain: ["#081222", "#14294e"],
  snow: ["#16324f", "#4d6f99"],
  leaves: ["#221833", "#7a4a2e"],
  storm: ["#050a16", "#0d1e38"],
  aurora: ["#020d1e", "#0b2547"],
  wind: ["#04101f", "#0b2547"],
  finale: ["#1a1033", "#e8a05a"],
};
const starry: ReadonlySet<Weather> = new Set(["clear", "aurora", "wind", "finale"]);

type RunState = {
  p: Runner;
  level: number;
  plats: Plat[];
  chips: Chip[];
  bugs: Bug[];
  levelW: number;
  flagX: number;
  camX: number;
  cpX: number;
  hurtAt: number;
  keys: Set<string>;
  sparks: Spark[];
  lastBurst: number;
  plane: { x: number; active: boolean; bannerIdx: number };
  planesSeen: number;
  lastPlaneAt: number;
  bannerRect: BannerRect | null;
  totalChips: number;
  giantUntil: number;
  diff: Difficulty;
};

const runDiffs: Record<Difficulty, { label: { ko: string; en: string }; spd: number; extra: number; hearts: number }> = {
  easy: { label: { ko: "쉬움", en: "Easy" }, spd: .8, extra: -1, hearts: 4 },
  normal: { label: { ko: "보통", en: "Normal" }, spd: 1, extra: 0, hearts: 3 },
  hard: { label: { ko: "어려움", en: "Hard" }, spd: 1.3, extra: 1, hearts: 2 },
};

const GIANT_CHIPS = 12;
const GIANT_MS = 9000;

const bannerDefs = [
  { ko: "제품을 생각하고 기업을 생각하고 의사소통이 뛰어난 김도원 추천합니다", en: "Product · Business · Communication — Kim Dowon, recommended.", url: "" },
  { ko: "OpenStockAI — 질문을 전문 역할로 라우팅하는 AI Agent ↗", en: "OpenStockAI — an AI agent that routes expert queries ↗", url: "https://opendoor.supply/ko" },
  { ko: "OpenDoorLabs · 더 많은 프로젝트는 Selected Work에서 ↗", en: "OpenDoorLabs — more case studies in Selected Work ↗", url: "/work" },
] as const;

function buildLevel(level: number, diff: Difficulty) {
  const levelW = 2300 + (level - 1) * 560;
  const flagX = levelW - 70;
  const plats: Plat[] = [];
  const chips: Chip[] = [];
  const bugs: Bug[] = [];
  const gapW = (i: number) => Math.min(60 + ((i * 31 + level * 23) % 52) + level * 6, 138);
  const segW = (i: number) => 320 + ((i * 47 + level * 19) % 130) + (level >= 7 ? 30 : 0);
  const segs: Plat[] = [];
  let x = 0;
  let i = 0;
  while (x < levelW - 200) {
    const len = Math.min(segW(i), levelW - x);
    segs.push({ x, y: GROUND_TOP, w: len, h: 80 });
    x += len;
    if (x < levelW - 260) x += gapW(i);
    i += 1;
  }
  const last = segs[segs.length - 1];
  last.w = levelW - last.x;
  plats.push(...segs);
  let li = 0;
  for (const [si, seg] of segs.entries()) {
    if (si > 0 && seg.w > 200) {
      const count = Math.max(1, (seg.w > 340 && level >= 2 ? 2 : 1) + (seg.w > 360 && level >= 6 ? 1 : 0) + (seg.w > 300 ? runDiffs[diff].extra : 0));
      for (let b = 0; b < count; b += 1) {
        const minX = seg.x + 26 + b * 70;
        const maxX = Math.min(seg.x + seg.w - 26, minX + 150 + level * 20);
        if (maxX - minX < 60) continue;
        bugs.push({ x: minX + 40, minX, maxX, spd: (1.2 + level * .22) * runDiffs[diff].spd, dir: b % 2 === 0 ? 1 : -1, kind: (level - 1) % 3, dead: false, deadAt: 0 });
      }
    }
    if (seg.w < 170) continue;
    const fy = si % 2 === 0 ? 288 : 252;
    const fw = 92;
    const fx = seg.x + (seg.w - fw) / 2;
    plats.push({ x: fx, y: fy, w: fw, h: 14 });
    if (li < CHIP_LABELS.length) {
      chips.push({ x: fx + fw / 2, y: fy - 28, label: CHIP_LABELS[li], got: false });
      li += 1;
    }
    if (seg.w > 380 && si % 3 === 1) {
      const fy2 = 232;
      const fx2 = seg.x + 60;
      plats.push({ x: fx2, y: fy2, w: 84, h: 14 });
      if (li < CHIP_LABELS.length) {
        chips.push({ x: fx2 + 42, y: fy2 - 28, label: CHIP_LABELS[li], got: false });
        li += 1;
      }
    }
    if (seg.w > 300 && (si + level) % 3 === 0) {
      const sx = seg.x + seg.w - 140;
      for (let s = 0; s < 3; s += 1) {
        plats.push({ x: sx + s * 26, y: GROUND_TOP - 24 * (s + 1), w: 26, h: 24 * (s + 1) });
      }
      if (li < CHIP_LABELS.length) {
        chips.push({ x: sx + 3 * 26 + 13, y: GROUND_TOP - 96, label: CHIP_LABELS[li], got: false });
        li += 1;
      }
    }
  }
  for (const [si, seg] of segs.entries()) {
    const next = segs[si + 1];
    if (!next || li >= CHIP_LABELS.length) break;
    const gx = seg.x + seg.w;
    const gw = next.x - gx;
    if (gw > 50 && gw < 150) {
      chips.push({ x: gx + gw / 2, y: 296, label: CHIP_LABELS[li], got: false });
      li += 1;
    }
  }
  return { plats, chips, bugs, levelW, flagX };
}

function freshRun(level = 1, hearts = 3, diff: Difficulty = "normal"): RunState {
  const built = buildLevel(level, diff);
  return {
    p: { x: 50, y: GROUND_TOP - PH, vx: 0, vy: 0, grounded: true, hearts, invUntil: 0 },
    level,
    plats: built.plats,
    chips: built.chips,
    bugs: built.bugs,
    levelW: built.levelW,
    flagX: built.flagX,
    camX: 0,
    cpX: 50,
    hurtAt: 0,
    keys: new Set(),
    sparks: [],
    lastBurst: 0,
    plane: { x: 0, active: false, bannerIdx: 0 },
    planesSeen: 0,
    lastPlaneAt: 0,
    bannerRect: null,
    totalChips: 0,
    giantUntil: 0,
    diff,
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

function drawBear(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, t: number, moving: boolean, airborne: boolean, giant = false) {
  if (giant) {
    ctx.save();
    const scale = 1.75;
    ctx.translate(x, y + PH);
    ctx.scale(scale, scale);
    ctx.translate(-x, -(y + PH));
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 12;
  }
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
  if (giant) { ctx.shadowBlur = 0; ctx.restore(); }
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
  const body = b.kind === 1 ? "#7a5fc0" : b.kind === 2 ? "#3a4a66" : "#c05a52";
  const edge = b.kind === 1 ? "#4a3578" : b.kind === 2 ? "#1c2740" : "#6e2f2a";
  ctx.fillStyle = body;
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(b.x - 12, y, 24, h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = edge;
  ctx.fillRect(b.x - 12, y + h * .55, 24, 1.5);
  if (!b.dead && b.kind === 1) {
    ctx.fillStyle = edge;
    for (let s = 0; s < 3; s += 1) {
      ctx.beginPath();
      ctx.moveTo(b.x - 9 + s * 9, y + 1);
      ctx.lineTo(b.x - 5 + s * 9, y - 6);
      ctx.lineTo(b.x - 1 + s * 9, y + 1);
      ctx.fill();
    }
  }
  if (!b.dead && b.kind === 2) {
    ctx.strokeStyle = "#7ee0ff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x - 3, y - 1); ctx.lineTo(b.x + 1, y - 5); ctx.lineTo(b.x - 1, y - 5); ctx.lineTo(b.x + 4, y - 10);
    ctx.stroke();
  }
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

function drawWeather(ctx: CanvasRenderingContext2D, weather: Weather, now: number) {
  if (weather === "rain" || weather === "storm") {
    const drops = weather === "storm" ? 90 : 55;
    ctx.strokeStyle = "rgba(140,190,255,.45)";
    ctx.lineWidth = 1;
    for (let i = 0; i < drops; i += 1) {
      const x = ((i * 97 + Math.floor(now / 16) * 13) % (W + 30)) - 15;
      const y = ((i * 61 + now * (.5 + (i % 3) * .12)) % (H + 20)) - 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 9);
      ctx.stroke();
    }
    if (weather === "storm" && Math.floor(now / 2600) % 2 === 0 && (now % 2600) < 90) {
      ctx.fillStyle = `rgba(230,240,255,${.22 * (1 - (now % 2600) / 90)})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else if (weather === "snow") {
    ctx.fillStyle = "rgba(235,245,255,.8)";
    for (let i = 0; i < 60; i += 1) {
      const x = ((i * 89 + Math.sin(now / 900 + i * 1.7) * 18 + W * 3) % (W + 20)) - 10;
      const y = ((i * 53 + now * (.07 + (i % 3) * .03)) % (GROUND_TOP + 20)) - 10;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 3) * .5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === "leaves") {
    for (let i = 0; i < 26; i += 1) {
      const drift = now * (.12 + (i % 4) * .05);
      const x = ((i * 113 + drift) % (W + 40)) - 20;
      const y = 30 + ((i * 71 + Math.sin(now / 500 + i) * 40 + now * .04) % (GROUND_TOP - 40));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(now / 300 + i);
      ctx.fillStyle = i % 3 === 0 ? "rgba(217,132,60,.75)" : "rgba(170,105,45,.65)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.4, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (weather === "fog") {
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 260 + now * .08) % (W + 320)) - 160;
      const y = 60 + i * 56;
      ctx.fillStyle = "rgba(190,215,240,.10)";
      ctx.beginPath();
      ctx.ellipse(x, y, 170, 22 + (i % 2) * 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === "aurora") {
    for (let band = 0; band < 3; band += 1) {
      const baseY = 60 + band * 40;
      ctx.strokeStyle = band === 1 ? "rgba(120,230,170,.30)" : band === 2 ? "rgba(150,120,255,.22)" : "rgba(94,232,162,.28)";
      ctx.lineWidth = 16 - band * 4;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 20) {
        const y = baseY + Math.sin(x / 90 + now / 1100 + band * 1.8) * 14;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (weather === "wind") {
    ctx.strokeStyle = "rgba(160,210,255,.3)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 24; i += 1) {
      const x = ((i * 167 + now * (.9 + (i % 3) * .3)) % (W + 80)) - 40;
      const y = 20 + ((i * 97) % (GROUND_TOP - 30));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 24 + (i % 4) * 8, y - 2);
      ctx.stroke();
    }
  } else if (weather === "finale") {
    ctx.fillStyle = "rgba(255,220,140,.7)";
    for (let i = 0; i < 30; i += 1) {
      const x = ((i * 137 + Math.sin(now / 800 + i * 2.3) * 24 + W * 3) % (W + 20)) - 10;
      const y = GROUND_TOP - ((i * 61 + now * (.08 + (i % 3) * .04)) % GROUND_TOP);
      ctx.globalAlpha = .3 + Math.abs(Math.sin(now / 600 + i)) * .5;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + (i % 3) * .4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, g: RunState, now: number, en: boolean, phase: string) {
  const weather = levelWeather[Math.min(g.level - 1, levelWeather.length - 1)];
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (now - g.hurtAt < 320) ctx.translate((Math.random() - .5) * 5, (Math.random() - .5) * 5);
  const cam = g.camX;
  const [skyTop, skyBottom] = skies[weather];
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_TOP);
  sky.addColorStop(0, skyTop);
  sky.addColorStop(1, skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_TOP + 2);
  if (starry.has(weather)) {
    ctx.fillStyle = "rgba(200,220,255,.5)";
    for (let s = 0; s < 40; s += 1) {
      const sx = (s * 137.5) % g.levelW - cam * .15;
      const sy = 18 + ((s * 89) % 150);
      if (sx > -4 && sx < W + 4) ctx.fillRect(sx, sy, 1.4, 1.4);
    }
  }
  if (weather === "dawn" || weather === "finale") {
    const sunX = W / 2 - cam * .05;
    ctx.fillStyle = weather === "finale" ? "rgba(255,200,110,.85)" : "rgba(255,170,110,.7)";
    ctx.beginPath();
    ctx.arc(sunX, 92, weather === "finale" ? 26 : 20, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [cx0, cy] of [[180, 62], [700, 96], [1250, 54], [1800, 88], [2240, 66], [2700, 74], [3100, 60]] as [number, number][]) {
    const cxx = cx0 - cam * .3;
    if (cxx < -80 || cxx > W + 80) continue;
    ctx.fillStyle = "rgba(143,195,255,.09)";
    ctx.beginPath();
    ctx.ellipse(cxx, cy, 34, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(cxx + 18, cy + 5, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#0d2949";
  for (const hill of [140, 620, 1160, 1680, 2160, 2600, 3050]) {
    const hx = hill - cam * .45;
    if (hx > -140 && hx < W + 140) {
      ctx.beginPath();
      ctx.ellipse(hx, GROUND_TOP + 8, 110, 60, 0, Math.PI, 0);
      ctx.fill();
    }
  }
  for (const plat of g.plats) {
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
  const fx = g.flagX - cam;
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
  const giant = now < g.giantUntil;
  if (!blink) {
    const dir = (g.p.vx >= 0 ? 1 : -1) as 1 | -1;
    drawBear(ctx, g.p.x - cam, g.p.y, dir, now, Math.abs(g.p.vx) > .4 && g.p.grounded, !g.p.grounded, giant);
  }
  ctx.fillStyle = "#ff6b5a";
  ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText("♥".repeat(Math.max(g.p.hearts, 0)) || "—", 16, 24);
  ctx.fillStyle = "#5ee8a2";
  const got = g.chips.filter((c) => c.got).length;
  ctx.fillText(`SKILLS ${got}/${g.chips.length} · TOTAL ${g.totalChips}`, 16, 40);
  if (giant) {
    const left = (g.giantUntil - now) / GIANT_MS;
    ctx.fillStyle = "#0d2949";
    ctx.fillRect(16, 48, 120, 6);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(16, 48, 120 * left, 6);
    ctx.fillText("★ GIANT", 142, 54);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = "#8ea9c1";
  const wName = en ? weatherNames[weather].en : weatherNames[weather].ko;
  ctx.fillText(`LV ${g.level}/${MAX_LEVEL} · ${wName.toUpperCase()} · MAP ${Math.min(Math.round(g.p.x / g.flagX * 100), 100)}%`, W - 16, 24);
  ctx.textAlign = "center";
  if (phase === "ready") {
    ctx.fillStyle = "#8ea9c1";
    ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(en ? "find who planted the flag" : "플래그를 꽂은 주인을 찾아보세요", W / 2, H - 16);
  }
  if (g.plane.active) {
    const def = bannerDefs[g.plane.bannerIdx % bannerDefs.length];
    const px = g.plane.x - cam;
    const py = 62 + Math.sin(now / 260) * 4;
    const bannerText = en ? def.en : def.ko;
    ctx.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";
    const textW = ctx.measureText(bannerText).width;
    const bw = textW + 20;
    const bh = 20;
    const bx = px - 26 - bw;
    const by = py - bh / 2 + Math.sin(now / 180 + px * .02) * 2;
    g.bannerRect = def.url ? { x: bx, y: by, w: bw, h: bh, url: def.url } : null;
    ctx.strokeStyle = "#8ea9c1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 12, py);
    ctx.lineTo(bx + bw, by + bh / 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(234,244,255,.95)";
    ctx.strokeStyle = def.url ? "#0b63ce" : "#2a5a8f";
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
  } else {
    g.bannerRect = null;
  }
  drawWeather(ctx, weather, now);
  ctx.restore();
}

export function BearRun({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<RunState>(freshRun());
  const phaseRef = useRef<"ready" | "run" | "stage" | "won" | "lost">("ready");
  const [phase, setPhase] = useState<"ready" | "run" | "stage" | "won" | "lost">("ready");
  const [level, setLevel] = useState(1);
  const [diff, setDiff] = useState<Difficulty>("normal");
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startGame = (d: Difficulty) => {
    gameRef.current = freshRun(1, runDiffs[d].hearts, d);
    setDiff(d);
    setLevel(1);
    setShowPromo(false);
    setPhase("run");
  };

  const nextLevel = () => {
    const g = gameRef.current;
    const next = g.level + 1;
    const hearts = Math.min(g.p.hearts + 1, 4);
    const built = buildLevel(next, g.diff);
    g.level = next;
    g.plats = built.plats;
    g.chips = built.chips;
    g.bugs = built.bugs;
    g.levelW = built.levelW;
    g.flagX = built.flagX;
    g.p = { x: 50, y: GROUND_TOP - PH, vx: 0, vy: 0, grounded: true, hearts, invUntil: 0 };
    g.camX = 0;
    g.cpX = 50;
    g.plane.active = false;
    setLevel(next);
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
    const onDown = (event: PointerEvent) => {
      const g = gameRef.current;
      const br = g.bannerRect;
      if (br) {
        const rect = canvas.getBoundingClientRect();
        const cx = (event.clientX - rect.left) * (W / rect.width);
        const cy = (event.clientY - rect.top) * (H / rect.height);
        if (cx >= br.x && cx <= br.x + br.w && cy >= br.y && cy <= br.y + br.h) {
          window.open(br.url, "_blank", "noreferrer");
          return;
        }
      }
      tryJump();
    };
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
      const giant = now < g.giantUntil;
      if (phase === "run") {
        const speed = giant ? RUN_SPEED * 1.15 : RUN_SPEED;
        const move = (g.keys.has("ArrowRight") || g.keys.has("d") ? 1 : 0) - (g.keys.has("ArrowLeft") || g.keys.has("a") ? 1 : 0);
        p.vx = move ? Math.min(Math.max(p.vx + move * .9, -speed), speed) : p.vx * .82;
        if (Math.abs(p.vx) < .2) p.vx = 0;
        p.x += p.vx;
        p.x = Math.min(Math.max(p.x, 12), g.levelW - 12);
        const prevY = p.y;
        p.vy += GRAVITY;
        p.y += p.vy;
        p.grounded = false;
        for (const plat of g.plats) {
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
            g.totalChips += 1;
            burst(chip.x, chip.y, g.sparks, 10, "#5ee8a2");
            if (g.chips.every((c) => c.got)) {
              g.giantUntil = now + GIANT_MS;
              burst(p.x, p.y, g.sparks, 30, "#ffd166");
            }
          }
        }
        for (const bug of g.bugs) {
          if (bug.dead) continue;
          bug.x += bug.dir * bug.spd;
          if (bug.x > bug.maxX) { bug.x = bug.maxX; bug.dir = -1; }
          if (bug.x < bug.minX) { bug.x = bug.minX; bug.dir = 1; }
          const hitW = giant ? PW * 1.6 : PW;
          if (!overlaps(p.x - hitW / 2, p.y, hitW, PH, bug.x - 12, GROUND_TOP - 16, 24, 16)) continue;
          if (giant) {
            bug.dead = true;
            bug.deadAt = now;
            burst(bug.x, GROUND_TOP - 16, g.sparks, 14, "#ffd166");
            continue;
          }
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
        if (!g.plane.active && now - g.lastPlaneAt > 14000) {
          g.plane = { x: g.camX - 420, active: true, bannerIdx: g.planesSeen % bannerDefs.length };
          g.planesSeen += 1;
          g.lastPlaneAt = now;
        }
        if (g.plane.active) {
          g.plane.x += 1.7;
          if (g.plane.x > g.camX + W + 480) g.plane.active = false;
        }
        if (p.x >= g.flagX) setPhase(g.level >= MAX_LEVEL ? "won" : "stage");
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
      g.camX = Math.min(Math.max(p.x - W * .38, 0), g.levelW - W);
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

  const diffButtons = (
    <div className="sf-diff" role="group" aria-label={en ? "Difficulty" : "난이도"}>
      {(["easy", "normal", "hard"] as const).map((d) => (
        <button key={d} type="button" className={diff === d ? "active" : ""} onClick={() => setDiff(d)}>
          {runDiffs[d].label[locale]}
        </button>
      ))}
    </div>
  );

  const commentary = phase === "won"
    ? (en ? "The flag's owner is… Kim Dowon, of course. You collected his skill chips on the way." : "플래그의 주인은… 역시 김도원입니다. 오는 길에 그의 스킬 칩을 주웠으니까요.")
    : phase === "lost"
      ? (en ? "The bugs got you this time. Recharge and keep going." : "이번엔 버그들에게 졌네요. 재충전하고 계속 가보세요.")
      : phase === "stage"
        ? (en ? `Level ${level} clear! One heart recharged. The next map is longer and buggier.` : `레벨 ${level} 클리어! 하트가 하나 충전됩니다. 다음 맵은 더 길고 버그도 많아요.`)
      : phase === "run"
        ? (en ? `Level ${level}/${MAX_LEVEL}. Move: arrows·A/D. Jump: ↑·W·Space. Stomp bugs, grab chips, tap the banner plane for links.` : `레벨 ${level}/${MAX_LEVEL}. 이동: 방향키·A/D. 점프: ↑·W·스페이스. 버그를 밟고 칩을 모으세요. 배너 비행기를 누르면 링크로 이동합니다.`)
        : (en ? `${MAX_LEVEL} levels of side-scrolling — changing weather, skill chips, promo planes, and a flag at the end.` : `횡스크롤 ${MAX_LEVEL}레벨. 레벨마다 날씨가 바뀌고, 스킬 칩, 홍보 비행기 — 그리고 끝의 플래그.`);

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">{en ? "BEAR RUN" : "베어 런"}</span>
          <span className="wc-hud-match">{en ? `LEVEL ${level}/${MAX_LEVEL}` : `레벨 ${level}/${MAX_LEVEL}`}</span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "Bear run platformer canvas" : "베어 런 플랫폼 게임 캔버스"} role="img" />
          {phase === "ready" && (
            <div className="bb-overlay">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">BEAR RUN</span>
              <h2>{en ? "Run to the flag." : "플래그까지 달려라."}</h2>
              {diffButtons}
              <p>{en ? `${MAX_LEVEL} levels. Move: arrows·A/D. Jump: ↑·W·Space or tap. Collect every skill chip in a level to go GIANT — bugs can't hurt you then. Promo planes fly by on their own; tap a banner for links.` : `${MAX_LEVEL}개 레벨. 이동: 방향키·A/D. 점프: ↑·W·스페이스 또는 탭. 레벨의 칩을 전부 모으면 거대화 — 악당이 닿기만 해도 사라집니다. 홍보 비행기는 주기적으로 지나가고, 배너를 누르면 링크로 이동합니다.`}</p>
              <Button type="button" onClick={() => startGame(diff)}>{en ? "Run" : "달리기"} <PersonSimpleRunIcon size={17} /></Button>
            </div>
          )}
          {phase === "stage" && (
            <div className="bb-overlay">
              <BlueBear mood="happy" className="bb-overlay-bear" />
              <span className="wc-kicker">{en ? `LEVEL ${level} CLEAR` : `레벨 ${level} 클리어`}</span>
              <h2>{en ? "Flag captured." : "플래그 확보."}</h2>
              <p>{en ? `+1 heart. Level ${level + 1} is longer, gaps are wider, and the bugs are faster.` : `하트 +1. 레벨 ${level + 1}은 더 길고, 갭은 넓고, 버그는 빠릅니다.`}</p>
              <Button type="button" onClick={nextLevel}>{en ? `Level ${level + 1}` : `레벨 ${level + 1}`} <ArrowRightIcon size={17} /></Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">OUT OF HEARTS</span>
              <h2>{en ? "Hearts empty." : "하트 소진."}</h2>
              {diffButtons}
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b><br />
                {en ? "(He'll refill your hearts.)" : "(하트는 김도원이 채워줍니다.)"}
              </p>
              <div className="bb-promo-actions">
                <Button type="button" onClick={continueRun}><HeartIcon size={17} /> {en ? "Recharge & continue" : "하트 재충전"}</Button>
                <Button type="button" variant="secondary" onClick={() => startGame(diff)}><ArrowCounterClockwiseIcon size={17} /> {en ? "From the top" : "처음부터"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
          {showPromo && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">ALL LEVELS CLEARED</span>
              <h2>{en ? "The flag's owner is… Kim Dowon." : "플래그의 주인은… 김도원."}</h2>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={() => startGame(diff)}><FlagIcon size={17} /> {en ? "Run again" : "다시 달리기"}</Button>
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
