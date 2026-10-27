import type { Metadata } from "next";
import { Arcade } from "@/components/arcade";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "푸른곰 아케이드 | 김도원",
      description: "푸른곰이 준비한 미니게임 3종 — 이상형 월드컵, 벽돌깨기, 졸라맨 대전. 클리어하면 중요한 진실을 알게 됩니다.",
    },
    en: {
      title: "BlueBear Arcade | Kim Dowon",
      description: "Three mini games hosted by BlueBear — the Ideal Type World Cup, a brick breaker, and a stickman bout. Clear them to learn an important truth.",
    },
  });
}

export default function PlayPage() {
  return <Arcade />;
}
