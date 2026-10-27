"use client";

import { SquaresFourIcon, TrophyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BlueBear } from "@/components/bluebear";
import { BrickBreaker } from "@/components/brickbreaker";
import { useLocale } from "@/components/locale-provider";
import { WorldCup } from "@/components/worldcup";

type GameId = "worldcup" | "bricks";

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
  ];

  return (
    <main id="main" className="wc-page">
      <section className="wc-intro ac-hub" aria-label={en ? "BlueBear arcade" : "푸른곰 아케이드"}>
        <BlueBear className="wc-intro-bear" mood="smug" />
        <span className="wc-kicker">BLUEBEAR ARCADE</span>
        <h1>{en ? "BlueBear Arcade" : "푸른곰 아케이드"}</h1>
        <p>{en
          ? "Two mini games hosted by BlueBear. Win, and you will learn an important truth."
          : "푸른곰이 준비한 미니게임 2종입니다. 클리어하면 중요한 진실을 알게 됩니다."}</p>
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
