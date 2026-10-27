import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "김도원 | 제품 흐름을 만드는 Frontend · AI Agent 개발자",
      description: "사용자의 말을 완료된 일로 바꾸는 Frontend와 AI Agent 제품 개발자 김도원의 포트폴리오입니다.",
    },
    en: {
      title: "Kim Dowon | Frontend & AI Agent Product Engineer",
      description: "Kim Dowon builds frontend and AI agent products that turn user requests into completed work.",
    },
  });
}

export default function HomePage() {
  return <Portfolio page="home" />;
}
