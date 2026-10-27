"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, TrophyIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BearBubble, BlueBear } from "@/components/bluebear";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const W = 640;
const H = 420;
const PADDLE_W = 92;
const PADDLE_H = 12;
const PADDLE_Y = H - 34;
const BALL_R = 6;
const BALL_SPEED = 5.4;
const BRICK_ROWS = 4;
const BRICK_COLS = 8;
const BRICK_H = 24;
const TRAITS = ["PERF", "AGENT", "UI", "TEST", "3D", "TEAM", "SHIP", "ROI"];
const ROW_COLORS = ["#0d2949", "#0b63ce", "#3b8de0", "#8fc3ff"];
const SPARK_COLORS = ["#8fc3ff", "#5ee8a2", "#ffffff", "#4aa3ff", "#ffd166"];

type Brick = { x: number; y: number; w: number; h: number; alive: boolean; label: string; color: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number };
type GameState = {
  paddle: number;
  ball: { x: number; y: number; dx: number; dy: number; launched: boolean };
  bricks: Brick[];
  lives: number;
  cleared: number;
  keys: Set<string>;
  sparks: Spark[];
  lastBurst: number;
};

function buildBricks(): Brick[] {
  const margin = 14;
  const gap = 6;
  const top = 54;
  const w = (W - margin * 2 - gap * (BRICK_COLS - 1)) / BRICK_COLS;
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      bricks.push({
        x: margin + col * (w + gap),
        y: top + row * (BRICK_H + gap),
        w,
        h: BRICK_H,
        alive: true,
        label: TRAITS[(row * BRICK_COLS + col) % TRAITS.length],
        color: ROW_COLORS[row],
      });
    }
  }
  return bricks;
}

function freshState(): GameState {
  return {
    paddle: (W - PADDLE_W) / 2,
    ball: { x: W / 2, y: PADDLE_Y - BALL_R - 2, dx: 0, dy: 0, launched: false },
    bricks: buildBricks(),
    lives: 3,
    cleared: 0,
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
    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life, maxLife: life,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      size: 1.5 + Math.random() * 2,
    });
  }
}

function draw(ctx: CanvasRenderingContext2D, g: GameState, en: boolean) {
  ctx.fillStyle = "#071b32";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(143,195,255,.07)";
  ctx.lineWidth = 1;
  for (let x = 32; x < W; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (const brick of g.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.strokeStyle = "rgba(7,20,38,.5)";
    ctx.strokeRect(brick.x + .5, brick.y + .5, brick.w - 1, brick.h - 1);
    ctx.fillStyle = brick.color === "#8fc3ff" ? "#071b32" : "#eaf4ff";
    ctx.font = "700 9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brick.label, brick.x + brick.w / 2, brick.y + brick.h / 2 + .5);
  }
  ctx.fillStyle = "#0b63ce";
  ctx.fillRect(g.paddle, PADDLE_Y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#8fc3ff";
  ctx.fillRect(g.paddle, PADDLE_Y, PADDLE_W, 3);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  for (const spark of g.sparks) {
    ctx.globalAlpha = Math.max(spark.life / spark.maxLife, 0);
    ctx.fillStyle = spark.color;
    ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
  }
  ctx.globalAlpha = 1;
  if (!g.ball.launched && g.lives > 0 && g.cleared < g.bricks.length) {
    ctx.fillStyle = "rgba(234,244,255,.75)";
    ctx.font = "650 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(en ? "CLICK OR SPACE TO LAUNCH" : "클릭 또는 스페이스로 발사", W / 2, H - 12);
  }
}

export function BrickBreaker({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState>(freshState());
  const phaseRef = useRef<"ready" | "playing" | "won" | "lost">("ready");
  const [phase, setPhase] = useState<"ready" | "playing" | "won" | "lost">("ready");
  const [lives, setLives] = useState(3);
  const [cleared, setCleared] = useState(0);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const total = BRICK_ROWS * BRICK_COLS;

  const reset = () => {
    gameRef.current = freshState();
    setLives(3);
    setCleared(0);
    setShowPromo(false);
    setPhase("playing");
  };

  const launch = () => {
    const g = gameRef.current;
    if (phaseRef.current === "playing" && !g.ball.launched && g.lives > 0) {
      g.ball.launched = true;
      g.ball.dx = (Math.random() * 2 - 1) * 2;
      g.ball.dy = -Math.sqrt(BALL_SPEED * BALL_SPEED - g.ball.dx * g.ball.dx);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const toX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * W;
    };
    const onMove = (event: PointerEvent) => {
      const g = gameRef.current;
      g.paddle = Math.min(Math.max(toX(event.clientX) - PADDLE_W / 2, 0), W - PADDLE_W);
    };
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const g = gameRef.current;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (down) g.keys.add(event.key); else g.keys.delete(event.key);
        event.preventDefault();
      }
      if (down && event.key === " ") {
        launch();
        event.preventDefault();
      }
    };
    const keyDown = (event: KeyboardEvent) => onKey(event, true);
    const keyUp = (event: KeyboardEvent) => onKey(event, false);
    const onDown = (event: PointerEvent) => {
      onMove(event);
      launch();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
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
    draw(ctx, gameRef.current, en);
  }, [en]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "won") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    const step = (ts: number) => {
      const g = gameRef.current;
      const dt = last ? Math.min((ts - last) / 16.7, 2.5) : 1;
      last = ts;
      if (phase === "playing") {
        if (g.keys.has("ArrowLeft")) g.paddle = Math.max(g.paddle - 7 * dt, 0);
        if (g.keys.has("ArrowRight")) g.paddle = Math.min(g.paddle + 7 * dt, W - PADDLE_W);
        const ball = g.ball;
        if (!ball.launched) {
          ball.x = g.paddle + PADDLE_W / 2;
          ball.y = PADDLE_Y - BALL_R - 2;
        } else {
          ball.x += ball.dx * dt;
          ball.y += ball.dy * dt;
          if (ball.x < BALL_R) { ball.x = BALL_R; ball.dx = Math.abs(ball.dx); }
          if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.dx = -Math.abs(ball.dx); }
          if (ball.y < BALL_R) { ball.y = BALL_R; ball.dy = Math.abs(ball.dy); }
          if (ball.dy > 0 && ball.y + BALL_R >= PADDLE_Y && ball.y + BALL_R <= PADDLE_Y + PADDLE_H + 4 && ball.x >= g.paddle - BALL_R && ball.x <= g.paddle + PADDLE_W + BALL_R) {
            const offset = Math.max(-1, Math.min(1, (ball.x - (g.paddle + PADDLE_W / 2)) / (PADDLE_W / 2)));
            const angle = offset * (Math.PI / 3);
            ball.dx = Math.sin(angle) * BALL_SPEED;
            ball.dy = -Math.cos(angle) * BALL_SPEED;
            ball.y = PADDLE_Y - BALL_R - 1;
          }
          for (const brick of g.bricks) {
            if (!brick.alive) continue;
            const nx = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
            const ny = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
            const distSq = (ball.x - nx) ** 2 + (ball.y - ny) ** 2;
            if (distSq > BALL_R * BALL_R) continue;
            brick.alive = false;
            g.cleared += 1;
            const overlapX = brick.w / 2 + BALL_R - Math.abs(ball.x - (brick.x + brick.w / 2));
            const overlapY = brick.h / 2 + BALL_R - Math.abs(ball.y - (brick.y + brick.h / 2));
            if (overlapX < overlapY) ball.dx = -ball.dx; else ball.dy = -ball.dy;
            setCleared(g.cleared);
            if (g.cleared === g.bricks.length) { setPhase("won"); break; }
          }
          if (ball.y - BALL_R > H) {
            g.lives -= 1;
            setLives(g.lives);
            if (g.lives <= 0) {
              setPhase("lost");
            } else {
              ball.launched = false;
              ball.x = g.paddle + PADDLE_W / 2;
              ball.y = PADDLE_Y - BALL_R - 2;
            }
          }
        }
      }
      if (phase === "won" && !reduced) {
        if (ts - g.lastBurst > 340) {
          g.lastBurst = ts;
          burst(70 + Math.random() * (W - 140), 50 + Math.random() * 190, g.sparks);
        }
        for (const spark of g.sparks) {
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          spark.vy += .045 * dt;
          spark.vx *= .985;
          spark.life -= dt;
        }
        g.sparks = g.sparks.filter((spark) => spark.life > 0);
      }
      draw(ctx, g, en);
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
    ? (en ? "ALL BRICKS CLEARED. The truth is out — I always knew it." : "블록 전부 클리어. 진실이 밝혀졌습니다 — 사실 처음부터 알고 있었어요.")
    : phase === "lost"
      ? (en ? "Bricks remain. The truth needs another run — retry?" : "블록이 남았습니다. 진실을 보려면 한 번 더 — 다시 도전하시죠.")
      : phase === "playing"
        ? (en ? "Break all 32 bricks. Do not drop the ball." : "블록 32개를 모두 깨세요. 공은 놓치면 안 됩니다.")
        : (en ? "Clear every brick and I will tell you something important. Move the paddle with your mouse or arrow keys." : "블록을 전부 깨면 중요한 걸 알려드립니다. 마우스나 방향키로 바를 움직이세요.");

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">{en ? "BRICK BREAKER" : "벽돌깨기"}</span>
          <span className="wc-hud-match">{en ? `BRICKS ${cleared}/${total}` : `블록 ${cleared}/${total}`} · {"●".repeat(lives)}{"○".repeat(Math.max(3 - lives, 0))}</span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "Brick breaker game canvas" : "벽돌깨기 게임 캔버스"} role="img" />
          {phase === "ready" && (
            <div className="bb-overlay">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">BRICK BREAKER</span>
              <h2>{en ? "Break the wall." : "벽을 부수세요."}</h2>
              <p>{en ? "Paddle follows your mouse or arrow keys. 3 balls. Clear all 32 bricks." : "바는 마우스나 방향키로 움직입니다. 공은 3개. 블록 32개를 모두 깨면 됩니다."}</p>
              <Button type="button" onClick={() => setPhase("playing")}>{en ? "Start" : "시작"} <TrophyIcon size={17} /></Button>
            </div>
          )}
          {phase === "lost" && (
            <div className="bb-overlay">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">GAME OVER</span>
              <h2>{en ? `${cleared}/${total} cleared` : `${cleared}/${total} 클리어`}</h2>
              <p>{en ? "The remaining bricks keep their secret. One more try?" : "남은 블록이 비밀을 지키고 있습니다. 한 번 더?"}</p>
              <Button type="button" onClick={reset}><ArrowCounterClockwiseIcon size={17} /> {en ? "Retry" : "다시 도전"}</Button>
            </div>
          )}
          {showPromo && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">STAGE CLEAR</span>
              <h2>{en ? "All clear!" : "올클리어!"}</h2>
              <p className="bb-promo-copy">
                {en ? "Someone who thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "and communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Highly recommended." : "김도원 추천합니다."}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={reset}><ArrowCounterClockwiseIcon size={17} /> {en ? "Play again" : "다시 하기"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
