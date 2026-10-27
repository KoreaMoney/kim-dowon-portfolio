import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";

export const metadata: Metadata = {
  title: "Selected Work | 김도원",
  description: "WiseDental, 실시간 번역 Agent, OpenStockAI, OpenAlarm을 포함한 김도원의 제품 개발 사례입니다.",
};

export default function WorkPage() {
  return <Portfolio page="work" />;
}
