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
const SPARK_COLORS = ["#8fc3ff", "#5ee8a2", "#ffffff", "#4aa3ff", "#ffd166"];

type Vec = [number, number];
type Joints = { head: Vec; shoulder: Vec; hip: Vec; ef: Vec; hf: Vec; eb: Vec; hb: Vec; kf: Vec; ff: Vec; kb: Vec; fb: Vec };
type FighterAction = "idle" | "walk" | "punch" | "kick" | "hit" | "ko" | "win";
type Fighter = { x: number; dir: 1 | -1; hp: number; action: FighterAction; actionStart: number; hitDone: boolean; walkT: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type RoundState = "intro" | "live" | "clear";

type FightState = {
  player: Fighter;
  enemy: Fighter;
  round: number;
  roundState: RoundState;
  stateStart: number;
  keys: Set<string>;
  sparks: Spark[];
  lastBurst: number;
};

const ATTACKS = {
  punch: { dur: 340, range: 64, dmg: 7 },
  kick: { dur: 460, range: 84, dmg: 10 },
} as const;

const opponents = [
  { name: { ko: "면접 대기자", en: "The Interviewee" }, color: "#7c8ea3", speed: 2.1, dmgMul: .75, aggression: .45 },
  { name: { ko: "베테랑 졸라맨", en: "Veteran Stickman" }, color: "#42566e", speed: 2.8, dmgMul: 1, aggression: .62 },
  { name: { ko: "전설의 졸라맨", en: "Legendary Stickman" }, color: "#101c2c", speed: 3.3, dmgMul: 1.15, aggression: .8 },
] as const;

const newFighter = (x: number, dir: 1 | -1): Fighter => ({ x, dir, hp: 100, action: "idle", actionStart: 0, hitDone: false, walkT: 0 });

function freshFight(round: number): FightState {
  return { player: newFighter(140, 1), enemy: newFighter(500, -1), round, roundState: "intro", stateStart: performance.now(), keys: new Set(), sparks: [], lastBurst: 0 };
}

function burst(x: number, y: number, sparks: Spark[]) {
  for (let i = 0; i < 46; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.4 + Math.random() * 3.4;
    const life = 55 + Math.random() * 40;
    sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, color: SPARK_COLORS[i % SPARK_COLORS.length], size: 1.5 + Math.random() * 2 });
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

const hitJ: Joints = { head: [-8, -75], shoulder: [-6, -61], hip: [-2, -38], ef: [4, -72], hf: [8, -80], eb: [-12, -60], hb: [-15, -68], kf: [8, -20], ff: [6, 0], kb: [-9, -20], fb: [-8, 0] };
const koJ: Joints = { head: [-34, -9], shoulder: [-18, -8], hip: [2, -6], ef: [-16, -15], hf: [-24, -17], eb: [-10, -3], hb: [-17, -2], kf: [16, -8], ff: [30, -9], kb: [15, -3], fb: [28, -1] };

function winJ(t: number): Joints {
  const bob = Math.sin(t / 300) * 1.5;
  return { head: [0, -78 + bob], shoulder: [0, -62 + bob], hip: [0, -38], ef: [-6, -70], hf: [-12, -84 + bob], eb: [6, -70], hb: [12, -84 + bob], kf: [7, -20], ff: [5, 0], kb: [-7, -20], fb: [-5, 0] };
}

function drawStickman(ctx: CanvasRenderingContext2D, x: number, gy: number, dir: 1 | -1, color: string, j: Joints) {
  const px = (v: Vec) => x + v[0] * dir;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
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
}

function jointsOf(f: Fighter, now: number): Joints {
  const t = now - f.actionStart;
  if (f.action === "walk") return walkJ(t);
  if (f.action === "punch") {
    const p = Math.min(t / ATTACKS.punch.dur, 1);
    const ext = p < .45 ? p / .45 : (1 - p) / .55;
    return punchJ(Math.max(ext, 0));
  }
  if (f.action === "kick") {
    const p = Math.min(t / ATTACKS.kick.dur, 1);
    const ext = p < .45 ? p / .45 : (1 - p) / .55;
    return kickJ(Math.max(ext, 0));
  }
  if (f.action === "hit") return lerpJ(idleJ(t), hitJ, Math.min(t / 120, 1));
  if (f.action === "ko") return lerpJ(idleJ(0), koJ, Math.min(t / 420, 1));
  if (f.action === "win") return winJ(t);
  return idleJ(now);
}

function drawFrame(ctx: CanvasRenderingContext2D, g: FightState, now: number, en: boolean, playerName: string, enemyName: string, enemyColor: string, revealed: boolean) {
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(143,195,255,.07)";
  ctx.lineWidth = 1;
  for (let x = 32; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.strokeStyle = "#294662";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 2); ctx.lineTo(W, GROUND_Y + 2); ctx.stroke();
  ctx.fillStyle = "#8ea9c1";
  ctx.font = "600 9px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.fillText(playerName, 16, 22);
  ctx.textAlign = "right";
  ctx.fillText(revealed ? "KIM DOWON" : enemyName.toUpperCase(), W - 16, 22);
  const barW = 240;
  ctx.fillStyle = "#0d2949"; ctx.fillRect(16, 28, barW, 9); ctx.fillRect(W - 16 - barW, 28, barW, 9);
  ctx.fillStyle = "#0b63ce"; ctx.fillRect(16, 28, barW * Math.max(g.player.hp, 0) / 100, 9);
  ctx.fillStyle = enemyColor; ctx.fillRect(W - 16 - barW, 28, barW * Math.max(g.enemy.hp, 0) / 100, 9);
  ctx.strokeStyle = "#456581"; ctx.lineWidth = 1;
  ctx.strokeRect(16.5, 28.5, barW, 9); ctx.strokeRect(W - 16 - barW + .5, 28.5, barW, 9);
  ctx.textAlign = "center";
  ctx.fillStyle = "#8ea9c1";
  ctx.fillText(`ROUND ${g.round + 1}/3`, W / 2, 38);
  for (const spark of g.sparks) {
    ctx.globalAlpha = Math.max(spark.life / spark.maxLife, 0);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
  }
  ctx.globalAlpha = 1;
  const playerJoints = jointsOf(g.player, now);
  const enemyJoints = jointsOf(g.enemy, now);
  drawStickman(ctx, g.player.x, GROUND_Y, g.player.dir, "#4aa3ff", playerJoints);
  drawStickman(ctx, g.enemy.x, GROUND_Y, g.enemy.dir, enemyColor, enemyJoints);
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
  if (g.roundState === "clear" && g.enemy.action === "ko") {
    ctx.save();
    ctx.translate(g.enemy.x, GROUND_Y - 44);
    ctx.rotate(-.18);
    ctx.fillStyle = "#5ee8a2";
    ctx.font = "800 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(en ? "IDENTITY: KIM DOWON" : "정체: 김도원", 0, 0);
    ctx.restore();
  }
}

export function StickFight({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<FightState>(freshFight(0));
  const phaseRef = useRef<"ready" | "fight" | "won" | "lost">("ready");
  const [phase, setPhase] = useState<"ready" | "fight" | "won" | "lost">("ready");
  const [round, setRound] = useState(0);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const enemy = opponents[round] ?? opponents[opponents.length - 1];
  const enemyName = enemy.name[locale];

  const startGame = () => {
    gameRef.current = freshFight(0);
    setRound(0);
    setShowPromo(false);
    setPhase("fight");
  };

  const tryAttack = (kind: "punch" | "kick") => {
    const g = gameRef.current;
    const now = performance.now();
    if (phaseRef.current !== "fight" || g.roundState !== "live") return;
    const f = g.player;
    if (f.action === "idle" || f.action === "walk") {
      f.action = kind;
      f.actionStart = now;
      f.hitDone = false;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const keyDown = (event: KeyboardEvent) => {
      const g = gameRef.current;
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) { g.keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key); event.preventDefault(); }
      if (event.key === "z" || event.key === "j" || event.key === "Z" || event.key === "J") tryAttack("punch");
      if (event.key === "x" || event.key === "k" || event.key === "X" || event.key === "K") tryAttack("kick");
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
    drawFrame(ctx, gameRef.current, performance.now(), en, en ? "BLUE STICKMAN" : "푸른 졸라맨", enemyName, enemy.color, false);
  }, [en, enemyName, enemy.color]);

  useEffect(() => {
    if (phase !== "fight" && phase !== "won") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const step = (now: number) => {
      const g = gameRef.current;
      const foe = opponents[g.round];
      if (phase === "fight" && g.roundState === "intro" && now - g.stateStart > 950) { g.roundState = "live"; g.stateStart = now; }
      if (phase === "fight" && g.roundState === "live") {
        const p = g.player;
        const e = g.enemy;
        for (const f of [p, e]) {
          if (f.action === "ko") continue;
          f.dir = (f === p ? e.x - p.x : p.x - e.x) >= 0 ? 1 : -1;
        }
        if (p.action === "idle" || p.action === "walk") {
          const move = (g.keys.has("ArrowRight") || g.keys.has("d") ? 1 : 0) - (g.keys.has("ArrowLeft") || g.keys.has("a") ? 1 : 0);
          if (move) {
            p.action = "walk";
            p.walkT += 16;
            p.x = Math.min(Math.max(p.x + move * WALK_SPEED, 44), W - 44);
          } else if (p.action === "walk") p.action = "idle";
        }
        const dist = Math.abs(e.x - p.x);
        const eBusy = e.action !== "idle" && e.action !== "walk";
        if (!eBusy) {
          const desired = 52;
          if (dist > desired + 8) {
            e.action = "walk";
            e.walkT += 16;
            e.x += Math.sign(p.x - e.x) * foe.speed;
          } else if (now - e.actionStart > 500 - foe.aggression * 260 + Math.random() * 300) {
            e.action = Math.random() < .72 ? "punch" : "kick";
            e.actionStart = now;
            e.hitDone = false;
          } else {
            e.action = "idle";
          }
        }
        for (const [attacker, target] of [[p, e], [e, p]] as [Fighter, Fighter][]) {
          if ((attacker.action !== "punch" && attacker.action !== "kick") || attacker.hitDone) continue;
          const spec = ATTACKS[attacker.action];
          const progress = (now - attacker.actionStart) / spec.dur;
          const ext = progress < .45 ? progress / .45 : (1 - progress) / .55;
          if (progress >= 1) { attacker.action = "idle"; attacker.actionStart = now; continue; }
          if (ext > .55 && Math.abs(target.x - attacker.x) < spec.range + 12 && target.action !== "ko") {
            attacker.hitDone = true;
            const mul = attacker === e ? foe.dmgMul : 1;
            target.hp -= spec.dmg * mul;
            target.x = Math.min(Math.max(target.x + attacker.dir * 26, 44), W - 44);
            if (target.hp <= 0) {
              target.action = "ko";
              target.actionStart = now;
            } else {
              target.action = "hit";
              target.actionStart = now;
            }
          }
        }
        for (const f of [p, e]) {
          if (f.action === "hit" && now - f.actionStart > 300) { f.action = "idle"; f.actionStart = now; }
          if ((f.action === "punch" || f.action === "kick") && now - f.actionStart > ATTACKS[f.action].dur) { f.action = "idle"; f.actionStart = now; }
        }
        const gap = p.x - e.x;
        if (Math.abs(gap) < 32 && p.action !== "ko" && e.action !== "ko") {
          const push = (32 - Math.abs(gap)) / 2;
          p.x = Math.min(Math.max(p.x + Math.sign(gap) * push, 44), W - 44);
          e.x = Math.min(Math.max(e.x - Math.sign(gap) * push, 44), W - 44);
        }
        if (e.action === "ko" || p.action === "ko") {
          g.roundState = "clear";
          g.stateStart = now;
          if (e.action === "ko") { p.action = p.action === "ko" ? "ko" : "win"; p.actionStart = now; }
        }
      }
      if (g.roundState === "clear" && now - g.stateStart > 1500) {
        if (g.enemy.action === "ko") {
          if (g.round >= opponents.length - 1) {
            setPhase("won");
          } else {
            const next = g.round + 1;
            const keys = g.keys;
            gameRef.current = freshFight(next);
            gameRef.current.keys = keys;
            setRound(next);
          }
        } else {
          setPhase("lost");
        }
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
      const revealed = phase === "won" || (g.roundState === "clear" && g.enemy.action === "ko");
      drawFrame(ctx, g, now, en, en ? "BLUE STICKMAN" : "푸른 졸라맨", enemyName, foe.color, revealed);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, en, enemyName, reduced]);

  useEffect(() => {
    if (phase !== "won") return;
    const timer = window.setTimeout(() => setShowPromo(true), reduced ? 300 : 1400);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const commentary = phase === "won"
    ? (en ? "The last stickman standing… is also Kim Dowon. Everyone in this arena was him." : "최후까지 서 있는 졸라맨도… 김도원이었습니다. 이 아레나는 전부 김도원이었어요.")
    : phase === "lost"
      ? (en ? "Knocked out. The arena keeps its secret — get up and fight again." : "쓰러졌습니다. 아레나의 비밀은 아직입니다 — 일어나서 다시 싸워보죠.")
      : phase === "fight"
        ? (en ? `Round ${round + 1}/3. Move with arrows or A/D, punch with Z·J, kick with X·K.` : `라운드 ${round + 1}/3. 방향키·AD로 이동, Z·J는 펀치, X·K는 킥.`)
        : (en ? "A stickman tournament. Beat 3 opponents and I'll tell you who they really are." : "졸라맨 토너먼트입니다. 상대 3명을 쓰러뜨리면 그들의 진짜 정체를 알려드리죠.");

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">{en ? "STICKMAN BOUT" : "졸라맨 대전"}</span>
          <span className="wc-hud-match">{en ? `ROUND ${round + 1}/3` : `${round + 1}/3 라운드`}</span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "Stickman fighting game canvas" : "졸라맨 격투 게임 캔버스"} role="img" />
          {phase === "ready" && (
            <div className="bb-overlay">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">STICKMAN BOUT</span>
              <h2>{en ? "Enter the arena." : "아레나 입장."}</h2>
              <p>{en ? "Move: arrows or A/D. Punch: Z·J. Kick: X·K. On touch, use the buttons below." : "이동: 방향키·A/D. 펀치: Z·J. 킥: X·K. 모바일은 아래 버튼을 사용하세요."}</p>
              <Button type="button" onClick={startGame}>{en ? "Fight" : "대전 시작"} <BoxingGloveIcon size={17} /></Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="bb-overlay">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">K.O.</span>
              <h2>{en ? "You went down." : "쓰러졌습니다."}</h2>
              <p>{en ? "The stickmen's identities remain hidden. Stand up and try again." : "졸라맨들의 정체는 아직 베일에 있습니다. 일어나서 다시 도전하세요."}</p>
              <Button type="button" onClick={startGame}><ArrowCounterClockwiseIcon size={17} /> {en ? "Rematch" : "재대결"}</Button>
            </div>
          )}
          {showPromo && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">3-0 VICTORY</span>
              <h2>{en ? "The winner is… Kim Dowon." : "승자는… 김도원."}</h2>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended. (He fights well too.)" : "김도원 추천합니다. (싸움도 잘합니다.)"}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={startGame}><ArrowCounterClockwiseIcon size={17} /> {en ? "Fight again" : "다시 대전"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
        </div>
        {phase === "fight" && (
          <div className="sf-controls">
            <button type="button" aria-label={en ? "Move left" : "왼쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowLeft")} onPointerUp={() => gameRef.current.keys.delete("ArrowLeft")} onPointerLeave={() => gameRef.current.keys.delete("ArrowLeft")}>◀</button>
            <button type="button" aria-label={en ? "Move right" : "오른쪽 이동"} onPointerDown={() => gameRef.current.keys.add("ArrowRight")} onPointerUp={() => gameRef.current.keys.delete("ArrowRight")} onPointerLeave={() => gameRef.current.keys.delete("ArrowRight")}>▶</button>
            <button type="button" className="sf-attack" onPointerDown={() => tryAttack("punch")}>{en ? "PUNCH" : "펀치"}</button>
            <button type="button" className="sf-attack" onPointerDown={() => tryAttack("kick")}>{en ? "KICK" : "킥"}</button>
          </div>
        )}
      </div>
    </main>
  );
}
