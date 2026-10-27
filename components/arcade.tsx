"use client";

import { BoxingGloveIcon, PersonSimpleRunIcon, SquaresFourIcon, TrophyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BearRun } from "@/components/bearrun";
import { BlueBear } from "@/components/bluebear";
import { BrickBreaker } from "@/components/brickbreaker";
import { useLocale } from "@/components/locale-provider";
import { StickFight } from "@/components/stickfight";
import { WorldCup } from "@/components/worldcup";

type GameId = "worldcup" | "bricks" | "fight" | "run";

export function Arcade() {
  const { locale } = useLocale();
  return <LocalizedArcade key={locale} />;
}

function LocalizedArcade() {
  const { locale } = useLocale();
  const en = locale === "en";
  const [game, setGame] = useState<GameId | null>(null);
  const back = () => setGame(null);

  if (game === "worldcup") return <WorldCup onExit={back} />;
  if (game === "bricks") return <BrickBreaker onExit={back} />;
  if (game === "fight") return <StickFight onExit={back} />;
  if (game === "run") return <BearRun onExit={back} />;

  const games: { id: GameId; icon: typeof TrophyIcon; name: string; desc: string; note: string }[] = [
    {
      id: "worldcup",
      icon: TrophyIcon,
      name: en ? "Ideal Type World Cup" : "이상형 월드컵",
      desc: en
        ? "Pick your ideal developer in a bracket. BlueBear AI judges every match — and the final verdict."
        : "토너먼트로 이상형 개발자를 뽑으세요. 푸른곰 AI가 모든 경기와 최종 판정을 내립니다.",
      note: en ? "16 candidates · 1 verdict" : "16명의 후보 · 단 하나의 결론",
    },
    {
      id: "bricks",
      icon: SquaresFourIcon,
      name: en ? "Brick Breaker" : "벽돌깨기",
      desc: en
        ? "Break every brick with the paddle and ball. Clearing the stage reveals something important."
        : "바와 공으로 블록을 모두 깨보세요. 스테이지를 클리어하면 중요한 진실이 밝혀집니다.",
      note: en ? "32 bricks · a hidden truth" : "블록 32개 · 숨겨진 진실",
    },
    {
      id: "fight",
      icon: BoxingGloveIcon,
      name: en ? "Stickman Bout" : "졸라맨 대전",
      desc: en
        ? "A 3-round stickman tournament. Beat every opponent to learn their true identity."
        : "3라운드 졸라맨 토너먼트. 상대를 모두 쓰러뜨리면 그들의 진짜 정체가 밝혀집니다.",
      note: en ? "3 rounds · punch & kick" : "3라운드 · 펀치와 킥",
    },
    {
      id: "run",
      icon: PersonSimpleRunIcon,
      name: en ? "Bear Run" : "베어 런",
      desc: en
        ? "A side-scrolling platformer. Stomp bugs, collect 12 skill chips, and reach the flag."
        : "횡스크롤 플랫폼 게임. 버그를 밟고, 스킬 칩 12개를 모아 플래그까지 달리세요.",
      note: en ? "3 hearts · 12 chips" : "하트 3개 · 칩 12개",
    },
  ];

  return (
    <main id="main" className="wc-page">
      <section className="wc-intro ac-hub" aria-label={en ? "BlueBear arcade" : "푸른곰 아케이드"}>
        <BlueBear className="wc-intro-bear" mood="smug" />
        <span className="wc-kicker">BLUEBEAR ARCADE</span>
        <h1>{en ? "BlueBear Arcade" : "푸른곰 아케이드"}</h1>
        <p>{en
          ? "Four mini games hosted by BlueBear. Win, and you will learn an important truth."
          : "푸른곰이 준비한 미니게임 4종입니다. 클리어하면 중요한 진실을 알게 됩니다."}</p>
        <div className="ac-games">
          {games.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" className="ac-card" onClick={() => setGame(item.id)}>
                <span className="wc-card-icon"><Icon size={30} /></span>
                <strong>{item.name}</strong>
                <small>{item.desc}</small>
                <code>{item.note}</code>
                <em>PLAY</em>
              </button>
            );
          })}
        </div>
        <code className="wc-intro-command"><span aria-hidden="true">$</span> run arcade --host bluebear</code>
      </section>
    </main>
  );
}
