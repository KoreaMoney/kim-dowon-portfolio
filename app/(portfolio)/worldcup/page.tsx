import type { Metadata } from "next";
import { WorldCup } from "@/components/worldcup";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "푸른곰 이상형 월드컵 | 김도원",
      description: "푸른곰 AI가 진행하는 이상형 월드컵. 토너먼트로 당신의 이상형 개발자를 뽑으면 선택 패턴을 분석해 최종 판정을 내립니다.",
    },
    en: {
      title: "BlueBear Ideal Type World Cup | Kim Dowon",
      description: "An ideal-type bracket hosted by BlueBear AI. Pick your ideal developer through a tournament and let the AI analyze your choice pattern.",
    },
  });
}

export default function WorldCupPage() {
  return <WorldCup />;
}
