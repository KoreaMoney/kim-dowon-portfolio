import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "Selected Work | 김도원",
      description: "WiseDental, 실시간 번역 Agent, OpenStockAI, OpenAlarm을 포함한 김도원의 제품 개발 사례입니다.",
    },
    en: {
      title: "Selected Work | Kim Dowon",
      description: "Product work by Kim Dowon, including WiseDental, a real-time translation agent, OpenStockAI, and OpenAlarm.",
    },
  });
}

export default function WorkPage() {
  return <Portfolio page="work" />;
}
