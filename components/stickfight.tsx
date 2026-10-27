"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, BoxingGloveIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BearBubble, BlueBear } from "@/components/bluebear";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const W = 640;
const H = 420;
const GROUND_Y = H - 56;
const WALK_SPEED = 4.2;
const JUMP_V = 11.5;
const GRAVITY = .75;
const WAVE_CD = 1500;
const SPARK_COLORS = ["#8fc3ff", "#5ee8a2", "#ffffff", "#4aa3ff", "#ffd166"];

type Vec = [number, number];
type Joints = { head: Vec; shoulder: Vec; hip: Vec; ef: Vec; hf: Vec; eb: Vec; hb: Vec; kf: Vec; ff: Vec; kb: Vec; fb: Vec };
type FighterAction = "idle" | "walk" | "punch" | "kick" | "uppercut" | "wave" | "hit" | "ko" | "win";
type Fighter = { x: number; y: number; vy: number; dir: 1 | -1; hp: number; action: FighterAction; actionStart: number; hitDone: boolean; lastWave: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type Wave = { x: number; dir: 1 | -1; owner: "p" | "e"; life: number };
type Ring = { x: number; y: number; r: number; life: number; maxLife: number; color: string };
type RoundState = "intro" | "live" | "clear";
type Difficulty = "easy" | "normal" | "hard";

type FightState = {
  player: Fighter;
  enemy: Fighter;
  round: number;
  pw: number;
  ew: number;
  roundState: RoundState;
  stateStart: number;
  keys: Set<string>;
  sparks: Spark[];
  waves: Wave[];
  rings: Ring[];
  lastBurst: number;
  diff: Difficulty;
};

const ATTACKS = {
  punch: { dur: 340, range: 64, dmg: 7, lift: 46 },
  kick: { dur: 460, range: 84, dmg: 10, lift: 40 },
  uppercut: { dur: 540, range: 60, dmg: 15, lift: 110 },
  wave: { dur: 400, range: 0, dmg: 12, lift: 0 },
} as const;

const difficulties: Record<Difficulty, { label: { ko: string; en: string }; speed: number; dmg: number; aggro: number; eHp: number; pDmg: number }> = {
  easy: { label: { ko: "쉬움", en: "Easy" }, speed: .8, dmg: .7, aggro: .6, eHp: .8, pDmg: 1.25 },
  normal: { label: { ko: "보통", en: "Normal" }, speed: 1, dmg: 1, aggro: 1, eHp: 1, pDmg: 1 },
  hard: { label: { ko: "어려움", en: "Hard" }, speed: 1.15, dmg: 1.35, aggro: 1.25, eHp: 1.2, pDmg: .85 },
};

const roundForms = [
  { color: "#7c8ea3", glow: "", speed: 2.1, dmgMul: .75, aggression: .45, jumpy: false, caster: false },
  { color: "#6f86a8", glow: "", speed: 2.8, dmgMul: 1, aggression: .62, jumpy: true, caster: false },
  { color: "#f2c94c", glow: "#ffb46b", speed: 3.3, dmgMul: 1.15, aggression: .8, jumpy: true, caster: true },
] as const;

const newFighter = (x: number, dir: 1 | -1): Fighter => ({ x, y: 0, vy: 0, dir, hp: 100, action: "idle", actionStart: 0, hitDone: false, lastWave: 0 });

function freshFight(state: FightState | null, round: number, diff: Difficulty, pw: number, ew: number): FightState {
  const enemy = newFighter(500, -1);
  enemy.hp = 100 * difficulties[diff].eHp;
  return { player: newFighter(140, 1), enemy, round, pw, ew, roundState: "intro", stateStart: performance.now(), keys: state?.keys ?? new Set(), sparks: [], waves: [], rings: [], lastBurst: 0, diff };
}

function burst(x: number, y: number, sparks: Spark[], count = 46, color?: string) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 3.4;
    const life = 55 + Math.random() * 40;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, color: color ?? SPARK_COLORS[i % SPARK_COLORS.length], size: 1.5 + Math.random() * 2 });
  }
}

function lerpV(a: Vec, b: Vec, p: number): Vec {
  return [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
}

function lerpJ(a: Joints, b: Joints, p: number): Joints {
  return { head: lerpV(a.head, b.head, p), shoulder: lerpV(a.shoulder, b.shoulder, p), hip: lerpV(a.hip, b.hip, p), ef: lerpV(a.ef, b.ef, p), hf: lerpV(a.hf, b.hf, p), eb: lerpV(a.eb, b.eb, p), hb: lerpV(a.hb, b.hb, p), kf: lerpV(a.kf, b.kf, p), ff: lerpV(a.ff, b.ff, p), kb: lerpV(a.kb, b.kb, p), fb: lerpV(a.fb, b.fb, p) };
}

function idleJ(t: number): Joints {
  const bob = Math.sin(t / 380) * 1.6;
  return { head: [0, -76 + bob], shoulder: [0, -62 + bob], hip: [0, -38], ef: [9, -56 + bob], hf: [11, -46], eb: [-8, -56 + bob], hb: [-10, -46], kf: [7, -20], ff: [5, 0], kb: [-7, -20], fb: [-5, 0] };
}

function walkJ(t: number): Joints {
  const sw = Math.sin(t / 90) * 9;
  return { head: [0, -76], shoulder: [0, -62], hip: [0, -38], ef: [8 - sw * .4, -56], hf: [10 - sw * .6, -46], eb: [-8 + sw * .4, -56], hb: [-10 + sw * .6, -46], kf: [5 + sw * .5, -20], ff: [4 + sw, 0], kb: [-5 - sw * .5, -20], fb: [-4 - sw, 0] };
}

function punchJ(ext: number): Joints {
  const base = idleJ(0);
  return { ...base, head: [4 * ext, -76], shoulder: [4 * ext, -62], ef: lerpV(base.ef, [16, -62], ext), hf: lerpV(base.hf, [38, -62], ext), eb: lerpV(base.eb, [-6, -58], ext), hb: lerpV(base.hb, [3, -54], ext) };
}

function kickJ(ext: number): Joints {
  const base = idleJ(0);
  return { ...base, head: [-5 * ext, -76], shoulder: [-5 * ext, -62], kf: lerpV(base.kf, [20, -36], ext), ff: lerpV(base.ff, [40, -32], ext), ef: lerpV(base.ef, [-4, -58], ext), hf: lerpV(base.hf, [-8, -52], ext) };
}

function uppercutJ(ext: number): Joints {
  const base = idleJ(0);
  return { ...base, head: [-3 * ext, -74], shoulder: [-3 * ext, -60], ef: lerpV(base.ef, [14, -72], ext), hf: lerpV(base.hf, [20, -92], ext), eb: lerpV(base.eb, [-12, -54], ext), hb: lerpV(base.hb, [-16, -50], ext), kf: lerpV(base.kf, [9, -22], ext), ff: lerpV(base.ff, [8, 0], ext) };
}

function waveJ(ext: number): Joints {
  const base = idleJ(0);
  return { ...base, head: [-2 * ext, -76], shoulder: [-2 * ext, -62], ef: lerpV(base.ef, [18, -60], ext), hf: lerpV(base.hf, [26, -58], ext), eb: lerpV(base.eb, [14, -58], ext), hb: lerpV(base.hb, [24, -56], ext) };
}

const hitJ: Joints = { head: [-8, -75], shoulder: [-6, -61], hip: [-2, -38], ef: [4, -72], hf: [8, -80], eb: [-12, -60], hb: [-15, -68], kf: [8, -20], ff: [6, 0], kb: [-9, -20], fb: [-8, 0] };
const koJ: Joints = { head: [-34, -9], shoulder: [-18, -8], hip: [2, -6], ef: [-16, -15], hf: [-24, -17], eb: [-10, -3], hb: [-17, -2], kf: [16, -8], ff: [30, -9], kb: [15, -3], fb: [28, -1] };

function winJ(t: number): Joints {
  const bob = Math.sin(t / 300) * 1.5;
  return { head: [0, -78 + bob], shoulder: [0, -62 + bob], hip: [0, -38], ef: [-6, -70], hf: [-12, -84 + bob], eb: [6, -70], hb: [12, -84 + bob], kf: [7, -20], ff: [5, 0], kb: [-7, -20], fb: [-5, 0] };
}

function drawStickman(ctx: CanvasRenderingContext2D, x: number, gy: number, dir: 1 | -1, color: string, j: Joints, glow = "") {
  const px = (v: Vec) => x + v[0] * dir;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 14; }
  ctx.beginPath();
  ctx.moveTo(px(j.hip), gy + j.hip[1]); ctx.lineTo(px(j.kf), gy + j.kf[1]); ctx.lineTo(px(j.ff), gy + j.ff[1]);
  ctx.moveTo(px(j.hip), gy + j.hip[1]); ctx.lineTo(px(j.kb), gy + j.kb[1]); ctx.lineTo(px(j.fb), gy + j.fb[1]);
  ctx.moveTo(px(j.shoulder), gy + j.shoulder[1]); ctx.lineTo(px(j.hip), gy + j.hip[1]);
  ctx.moveTo(px(j.shoulder), gy + j.shoulder[1]); ctx.lineTo(px(j.ef), gy + j.ef[1]); ctx.lineTo(px(j.hf), gy + j.hf[1]);
  ctx.moveTo(px(j.shoulder), gy + j.shoulder[1]); ctx.lineTo(px(j.eb), gy + j.eb[1]); ctx.lineTo(px(j.hb), gy + j.hb[1]);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px(j.head), gy + j.head[1], 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function jointsOf(f: Fighter, now: number): Joints {
  const t = now - f.actionStart;
  if (f.action === "walk") return walkJ(t);
  if (f.action === "punch" || f.action === "kick" || f.action === "uppercut" || f.action === "wave") {
    const p = Math.min(t / ATTACKS[f.action].dur, 1);
    const ext = Math.max(p < .45 ? p / .45 : (1 - p) / .55, 0);
    if (f.action === "punch") return punchJ(ext);
    if (f.action === "kick") return kickJ(ext);
    if (f.action === "uppercut") return uppercutJ(ext);
    return waveJ(ext);
  }
  if (f.action === "hit") return lerpJ(idleJ(t), hitJ, Math.min(t / 120, 1));
  if (f.action === "ko") return lerpJ(idleJ(0), koJ, Math.min(t / 420, 1));
  if (f.action === "win") return winJ(t);
  return idleJ(now);
}

function drawFrame(ctx: CanvasRenderingContext2D, g: FightState, now: number, en: boolean, revealed: boolean) {
  const foe = roundForms[g.round];
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(143,195,255,.07)";
  ctx.lineWidth = 1;
  for (let x = 32; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.strokeStyle = "#294662";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 2); ctx.lineTo(W, GROUND_Y + 2); ctx.stroke();
  ctx.save();
  if (g.roundState === "clear" && now - g.stateStart < 360) {
    ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
  }
  ctx.fillStyle = "#8ea9c1";
  ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText(en ? "BLUE STICKMAN" : "푸른 졸라맨", 16, 22);
  ctx.textAlign = "right";
  ctx.fillText(revealed ? "KIM DOWON" : "???", W - 16, 22);
  const barW = 240;
  const enemyMax = 100 * difficulties[g.diff].eHp;
  ctx.fillStyle = "#0d2949"; ctx.fillRect(16, 28, barW, 9); ctx.fillRect(W - 16 - barW, 28, barW, 9);
  ctx.fillStyle = "#0b63ce"; ctx.fillRect(16, 28, barW * Math.max(g.player.hp, 0) / 100, 9);
  ctx.fillStyle = foe.color; ctx.fillRect(W - 16 - barW, 28, barW * Math.max(g.enemy.hp, 0) / enemyMax, 9);
  ctx.strokeStyle = "#456581"; ctx.lineWidth = 1;
  ctx.strokeRect(16.5, 28.5, barW, 9); ctx.strokeRect(W - 16 - barW + .5, 28.5, barW, 9);
  const waveReady = Math.min((now - g.player.lastWave) / WAVE_CD, 1);
  ctx.fillStyle = "#0d2949"; ctx.fillRect(16, 41, 120, 5);
  ctx.fillStyle = waveReady >= 1 ? "#5ee8a2" : "#315372"; ctx.fillRect(16, 41, 120 * waveReady, 5);
  ctx.fillStyle = "#6e8ba4"; ctx.textAlign = "left"; ctx.fillText(en ? "WAVE" : "장풍", 142, 46);
  ctx.textAlign = "center";
  ctx.fillStyle = "#8ea9c1";
  ctx.fillText(`ROUND ${g.round + 1}`, W / 2, 24);
  ctx.fillStyle = "#4aa3ff";
  ctx.fillText("●".repeat(g.pw) + "○".repeat(Math.max(2 - g.pw, 0)), W / 2 - 54, 40);
  ctx.fillStyle = "#b0524a";
  ctx.fillText("○".repeat(Math.max(2 - g.ew, 0)) + "●".repeat(g.ew), W / 2 + 54, 40);
  for (const wave of g.waves) {
    const color = wave.owner === "p" ? "#4aa3ff" : "#ff7a6b";
    const pulse = 7 + Math.sin(now / 60 + wave.x / 20) * 1.5;
    for (let t = 3; t >= 1; t -= 1) {
      ctx.globalAlpha = .1 * t;
      ctx.fillStyle = color;
      ctx.fillRect(wave.x - wave.dir * (8 + t * 9), GROUND_Y - 50 - 3 * t, wave.dir * (6 + t * 9), 6 * t * .8);
    }
    ctx.globalAlpha = .9;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(wave.x, GROUND_Y - 50, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(wave.x, GROUND_Y - 50, pulse * .45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  for (const ring of g.rings) {
    ctx.globalAlpha = Math.max(ring.life / ring.maxLife, 0) * .8;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const spark of g.sparks) {
    ctx.globalAlpha = Math.max(spark.life / spark.maxLife, 0);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
  }
  ctx.globalAlpha = 1;
  for (const [f, color] of [[g.player, "#4aa3ff"], [g.enemy, foe.color]] as [Fighter, string][]) {
    const shadow = Math.max(18 - f.y * .12, 7);
    ctx.globalAlpha = .3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(f.x, GROUND_Y + 4, shadow, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawStickman(ctx, f.x, GROUND_Y - f.y, f.dir, color, jointsOf(f, now), f === g.enemy ? foe.glow : "");
    if (f.action === "wave") {
      const p = Math.min((now - f.actionStart) / ATTACKS.wave.dur, 1);
      const ext = Math.max(p < .45 ? p / .45 : (1 - p) / .55, 0);
      ctx.globalAlpha = .25 + ext * .55;
      ctx.fillStyle = f === g.player ? "#4aa3ff" : "#ff7a6b";
      ctx.beginPath();
      ctx.arc(f.x + f.dir * 26, GROUND_Y - f.y - 58, 4 + ext * 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  if (g.roundState === "intro") {
    const p = Math.min((now - g.stateStart) / 900, 1);
    ctx.globalAlpha = 1 - Math.max(0, (now - g.stateStart - 500) / 400);
    ctx.fillStyle = "#eaf4ff";
    ctx.font = "800 34px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`ROUND ${g.round + 1}`, W / 2, H / 2 - 20);
    ctx.font = "800 22px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#5ee8a2";
    ctx.fillText(p > .4 ? "FIGHT!" : "…", W / 2, H / 2 + 14);
    ctx.globalAlpha = 1;
  }
  if (g.roundState === "clear") {
    ctx.fillStyle = "#eaf4ff";
    ctx.font = "800 20px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    const playerWon = g.enemy.action === "ko";
    ctx.fillText(playerWon ? "ROUND CLEAR" : "ROUND LOST", W / 2, H / 2 - 44);
    ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = "#8ea9c1";
    ctx.fillText(`${g.pw} : ${g.ew}`, W / 2, H / 2 - 22);
    if (playerWon && g.enemy.action === "ko") {
      ctx.save();
      ctx.translate(g.enemy.x, GROUND_Y - 44);
      ctx.rotate(-.18);
      ctx.fillStyle = "#5ee8a2";
      ctx.fillText(en ? "IDENTITY: KIM DOWON?!" : "정체: 김도원?!", 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
  if (g.roundState === "clear" && now - g.stateStart < 180) {
    ctx.fillStyle = `rgba(255,255,255,${.45 - (now - g.stateStart) / 180 * .45})`;
    ctx.fillRect(0, 0, W, H);
  }
}

export function StickFight({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<FightState>(freshFight(null, 0, "normal", 0, 0));
  const phaseRef = useRef<"ready" | "fight" | "won" | "lost">("ready");
  const [phase, setPhase] = useState<"ready" | "fight" | "won" | "lost">("ready");
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [diff, setDiff] = useState<Difficulty>("normal");
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const startGame = (d: Difficulty) => {
    gameRef.current = freshFight(null, 0, d, 0, 0);
    setDiff(d);
    setScore([0, 0]);
    setShowPromo(false);
    setPhase("fight");
  };

  const tryAttack = (kind: "punch" | "kick" | "uppercut" | "wave") => {
    const g = gameRef.current;
    const now = performance.now();
    if (phaseRef.current !== "fight" || g.roundState !== "live") return;
    const f = g.player;
    if (kind === "wave" && now - f.lastWave < WAVE_CD) return;
    if (f.action === "idle" || f.action === "walk") {
      f.action = kind;
      f.actionStart = now;
      f.hitDone = false;
      if (kind === "wave") f.lastWave = now;
    }
  };

  const tryJump = () => {
    const g = gameRef.current;
    if (phaseRef.current !== "fight" || g.roundState !== "live") return;
    const f = g.player;
    if (f.y === 0 && f.action !== "hit" && f.action !== "ko") f.vy = JUMP_V;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const keyDown = (event: KeyboardEvent) => {
      if (phaseRef.current !== "fight") return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key)) { gameRef.current.keys.add(key); event.preventDefault(); }
      if (key === "ArrowUp" || key === "w" || key === " ") { tryJump(); event.preventDefault(); }
      if (key === "z" || key === "j") tryAttack("punch");
      if (key === "x" || key === "k") tryAttack("kick");
      if (key === "c" || key === "u") tryAttack("uppercut");
      if (key === "v" || key === "s") tryAttack("wave");
    };
    const keyUp = (event: KeyboardEvent) => {
      gameRef.current.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    };
    const onDown = () => tryAttack("punch");
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
    drawFrame(ctx, gameRef.current, performance.now(), en, false);
  }, [en]);

  useEffect(() => {
    if (phase !== "fight" && phase !== "won") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const step = (now: number) => {
      const g = gameRef.current;
      const dm = difficulties[g.diff];
      const foe = roundForms[g.round];
      if (phase === "fight" && g.roundState === "intro" && now - g.stateStart > 950) { g.roundState = "live"; g.stateStart = now; }
      if (phase === "fight" && g.roundState === "live") {
        const p = g.player;
        const e = g.enemy;
        for (const f of [p, e]) {
          if (f.y > 0 || f.vy !== 0) {
            f.y += f.vy;
            f.vy -= GRAVITY;
            if (f.y <= 0) { f.y = 0; f.vy = 0; }
          }
          if (f.action === "ko") continue;
          f.dir = (f === p ? e.x - p.x : p.x - e.x) >= 0 ? 1 : -1;
        }
        const move = (g.keys.has("ArrowRight") || g.keys.has("d") ? 1 : 0) - (g.keys.has("ArrowLeft") || g.keys.has("a") ? 1 : 0);
        if (p.action === "idle" || p.action === "walk") {
          if (move) {
            p.action = "walk";
            p.x = Math.min(Math.max(p.x + move * WALK_SPEED, 44), W - 44);
          } else if (p.action === "walk") p.action = "idle";
        } else if (p.y > 0 && move && p.action !== "hit" && p.action !== "ko") {
          p.x = Math.min(Math.max(p.x + move * WALK_SPEED * .8, 44), W - 44);
        }
        const dist = Math.abs(e.x - p.x);
        const eBusy = e.action !== "idle" && e.action !== "walk";
        if (!eBusy && e.action !== "ko") {
          const desired = 52;
          if (foe.caster && dist > 150 && now - e.lastWave > 2600 / dm.aggro) {
            e.action = "wave";
            e.actionStart = now;
            e.hitDone = false;
            e.lastWave = now;
          } else if (dist > desired + 8) {
            e.action = "walk";
            e.x += Math.sign(p.x - e.x) * foe.speed * dm.speed;
            if (foe.jumpy && Math.random() < .012) e.vy = JUMP_V;
          } else if (now - e.actionStart > 500 - foe.aggression * dm.aggro * 260 + Math.random() * 300) {
            const roll = Math.random();
            e.action = roll < .62 ? "punch" : roll < .9 ? "kick" : "uppercut";
            e.actionStart = now;
            e.hitDone = false;
          } else {
            e.action = "idle";
          }
        }
        for (const [attacker, target] of [[p, e], [e, p]] as [Fighter, Fighter][]) {
          if (attacker.action === "wave") {
            const progress = (now - attacker.actionStart) / ATTACKS.wave.dur;
            const ext = progress < .45 ? progress / .45 : (1 - progress) / .55;
            if (!attacker.hitDone && ext > .5) {
              attacker.hitDone = true;
              const waveColor = attacker === p ? "#4aa3ff" : "#ff7a6b";
              burst(attacker.x + attacker.dir * 34, GROUND_Y - 50, g.sparks, 8, waveColor);
              g.waves.push({ x: attacker.x + attacker.dir * 34, dir: attacker.dir, owner: attacker === p ? "p" : "e", life: 80 });
            }
            if (progress >= 1) { attacker.action = "idle"; attacker.actionStart = now; }
            continue;
          }
          if ((attacker.action !== "punch" && attacker.action !== "kick" && attacker.action !== "uppercut") || attacker.hitDone) continue;
          const spec = ATTACKS[attacker.action];
          const progress = (now - attacker.actionStart) / spec.dur;
          const ext = progress < .45 ? progress / .45 : (1 - progress) / .55;
          if (progress >= 1) { attacker.action = "idle"; attacker.actionStart = now; continue; }
          if (ext > .55 && Math.abs(target.x - attacker.x) < spec.range + 12 && Math.abs(target.y - attacker.y) < spec.lift && target.action !== "ko") {
            attacker.hitDone = true;
            const mul = attacker === e ? foe.dmgMul * dm.dmg : dm.pDmg;
            target.hp -= spec.dmg * mul;
            target.x = Math.min(Math.max(target.x + attacker.dir * 26, 44), W - 44);
            burst(target.x, GROUND_Y - 46 - target.y, g.sparks, attacker.action === "uppercut" ? 20 : 10, attacker === p ? "#8fc3ff" : "#ff9d8a");
            if (attacker.action === "uppercut") target.vy = Math.max(target.vy, 6.5);
            if (target.hp <= 0) {
              target.action = "ko";
              target.actionStart = now;
            } else {
              target.action = "hit";
              target.actionStart = now;
            }
          }
        }
        for (const wave of g.waves) {
          wave.x += wave.dir * 7.5;
          wave.life -= 1;
          const target = wave.owner === "p" ? e : p;
          if (Math.abs(target.x - wave.x) < 22 && target.y < 74 && target.action !== "ko") {
            wave.life = 0;
            const mul = wave.owner === "e" ? foe.dmgMul * dm.dmg : dm.pDmg;
            const waveColor = wave.owner === "p" ? "#4aa3ff" : "#ff7a6b";
            burst(target.x, GROUND_Y - 46 - target.y, g.sparks, 16, waveColor);
            g.rings.push({ x: target.x, y: GROUND_Y - 46 - target.y, r: 8, life: 18, maxLife: 18, color: waveColor });
            target.hp -= ATTACKS.wave.dmg * mul;
            target.x = Math.min(Math.max(target.x + wave.dir * 30, 44), W - 44);
            if (target.hp <= 0) { target.action = "ko"; target.actionStart = now; }
            else { target.action = "hit"; target.actionStart = now; }
          }
        }
        g.waves = g.waves.filter((wave) => wave.life > 0 && wave.x > 10 && wave.x < W - 10);
        for (const f of [p, e]) {
          if (f.action === "hit" && now - f.actionStart > 300) { f.action = "idle"; f.actionStart = now; }
          if ((f.action === "punch" || f.action === "kick" || f.action === "uppercut") && now - f.actionStart > ATTACKS[f.action].dur) { f.action = "idle"; f.actionStart = now; }
        }
        const gap = p.x - e.x;
        if (Math.abs(gap) < 32 && p.y < 40 && e.y < 40 && p.action !== "ko" && e.action !== "ko") {
          const push = (32 - Math.abs(gap)) / 2;
          p.x = Math.min(Math.max(p.x + Math.sign(gap) * push, 44), W - 44);
          e.x = Math.min(Math.max(e.x - Math.sign(gap) * push, 44), W - 44);
        }
        if (e.action === "ko" || p.action === "ko") {
          const loser = e.action === "ko" ? e : p;
          const loserColor = loser === p ? "#8fc3ff" : "#ffb0a0";
          burst(loser.x, GROUND_Y - 40, g.sparks, 26, loserColor);
          g.rings.push({ x: loser.x, y: GROUND_Y - 40, r: 10, life: 24, maxLife: 24, color: loserColor });
          if (e.action === "ko") { g.pw += 1; if (p.action !== "ko") { p.action = "win"; p.actionStart = now; } }
          else { g.ew += 1; }
          setScore([g.pw, g.ew]);
          g.roundState = "clear";
          g.stateStart = now;
        }
      }
      if (g.roundState === "clear" && now - g.stateStart > 1600) {
        if (g.pw >= 2) {
          setPhase("won");
        } else if (g.ew >= 2) {
          setPhase("lost");
        } else {
          gameRef.current = freshFight(g, g.round + 1, g.diff, g.pw, g.ew);
        }
      }
      if (phase === "won" && !reduced) {
        if (now - g.lastBurst > 340) {
          g.lastBurst = now;
          burst(70 + Math.random() * (W - 140), 50 + Math.random() * 190, g.sparks);
        }
      }
      for (const spark of g.sparks) {
        spark.x += spark.vx; spark.y += spark.vy; spark.vy += .045; spark.vx *= .985; spark.life -= 1;
      }
      g.sparks = g.sparks.filter((spark) => spark.life > 0);
      for (const ring of g.rings) {
        ring.r += 3.4;
        ring.life -= 1;
      }
      g.rings = g.rings.filter((ring) => ring.life > 0);
      const revealed = phase === "won";
      drawFrame(ctx, g, now, en, revealed);
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
          {difficulties[d].label[locale]}
        </button>
      ))}
    </div>
  );

  const commentary = phase === "won"
    ? (en ? "Unmasked: the mystery stickman was Kim Dowon all along. He always is." : "정체 공개: 수수께끼 졸라맨은 김도원이었습니다. 늘 그렇듯이요.")
    : phase === "lost"
      ? (en ? "Match lost. Lower the difficulty if you must — the secret will wait." : "매치 패배. 필요하면 난이도를 낮추세요 — 비밀은 기다립니다.")
      : phase === "fight"
        ? (en ? `Best of 3 — score ${score[0]}:${score[1]}. Move: arrows·A/D. Jump: ↑·W·Space. Punch: Z·J, Kick: X·K, Uppercut: C·U, Wave: V·S.` : `3판 2선승 — 스코어 ${score[0]}:${score[1]}. 이동: 방향키·A/D. 점프: ↑·W·스페이스. 펀치: Z·J, 킥: X·K, 어퍼컷: C·U, 장풍: V·S.`)
        : (en ? "Best of 3 vs a mystery stickman. Win 2 rounds and I'll unmask him. Pick your difficulty first." : "수수께끼 졸라맨과 3판 2선승. 2라운드를 이기면 정체를 공개합니다. 먼저 난이도를 고르세요.");

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">{en ? "STICKMAN BOUT" : "졸라맨 대전"}</span>
          <span className="wc-hud-match">{score[0]} : {score[1]} · {en ? difficulties[diff].label.en : difficulties[diff].label.ko}</span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "Stickman fighting game canvas" : "졸라맨 격투 게임 캔버스"} role="img" />
          {phase === "ready" && (
            <div className="bb-overlay">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">STICKMAN BOUT</span>
              <h2>{en ? "Enter the arena." : "아레나 입장."}</h2>
              {diffButtons}
              <p>{en ? "Best of 3. Move: arrows·A/D. Jump: ↑·W·Space. Punch: Z·J. Kick: X·K. Uppercut: C·U. Wave: V·S. Touch buttons appear in-fight." : "3판 2선승. 이동: 방향키·A/D. 점프: ↑·W·스페이스. 펀치: Z·J. 킥: X·K. 어퍼컷: C·U. 장풍: V·S. 모바일은 대전 중 버튼을 사용하세요."}</p>
              <Button type="button" onClick={() => startGame(diff)}>{en ? "Fight" : "대전 시작"} <BoxingGloveIcon size={17} /></Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="bb-overlay">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">DEFEAT</span>
              <h2>{en ? "Match lost." : "매치 패배."}</h2>
              {diffButtons}
              <p>{en ? "The mystery stickman keeps his mask. Stand up and try again." : "수수께끼 졸라맨은 가면을 지켰습니다. 일어나서 다시 도전하세요."}</p>
              <Button type="button" onClick={() => startGame(diff)}><ArrowCounterClockwiseIcon size={17} /> {en ? "Rematch" : "재대결"}</Button>
            </div>
          )}
          {showPromo && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">{en ? `VICTORY ${score[0]}:${score[1]}` : `승리 ${score[0]}:${score[1]}`}</span>
              <h2>{en ? "The winner is… Kim Dowon." : "승자는… 김도원."}</h2>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={() => startGame(diff)}><ArrowCounterClockwiseIcon size={17} /> {en ? "Fight again" : "다시 대전"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
        </div>
        {phase === "fight" && (
          <div className="sf-controls">
            <div className="sf-row">
              <button type="button" aria-label={en ? "Move left" : "왼쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowLeft")} onPointerUp={() => gameRef.current.keys.delete("ArrowLeft")} onPointerLeave={() => gameRef.current.keys.delete("ArrowLeft")}>◀</button>
              <button type="button" aria-label={en ? "Jump" : "점프"} onPointerDown={() => tryJump()}>▲</button>
              <button type="button" aria-label={en ? "Move right" : "오른쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowRight")} onPointerUp={() => gameRef.current.keys.delete("ArrowRight")} onPointerLeave={() => gameRef.current.keys.delete("ArrowRight")}>▶</button>
            </div>
            <div className="sf-row sf-row--four">
              <button type="button" className="sf-attack sf-attack--punch" onPointerDown={() => tryAttack("punch")}>{en ? "PUNCH" : "펀치"}</button>
              <button type="button" className="sf-attack sf-attack--kick" onPointerDown={() => tryAttack("kick")}>{en ? "KICK" : "킥"}</button>
              <button type="button" className="sf-attack sf-attack--upper" onPointerDown={() => tryAttack("uppercut")}>{en ? "UPPER" : "어퍼컷"}</button>
              <button type="button" className="sf-attack sf-attack--wave" onPointerDown={() => tryAttack("wave")}>{en ? "WAVE" : "장풍"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
