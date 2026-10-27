import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "Career | 김도원",
      description: "반도체 현장 품질부터 3D Frontend와 AI Agent 제품까지 이어진 김도원의 5년 경력입니다.",
    },
    en: {
      title: "Career | Kim Dowon",
      description: "Five years of Kim Dowon's work, from semiconductor quality operations to 3D frontend and AI agent products.",
    },
  });
}

export default function CareerPage() {
  return <Portfolio page="career" />;
}
