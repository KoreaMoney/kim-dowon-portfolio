import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "Contact | 김도원",
      description: "AI Agent 구축과 Frontend 제품 개발 협업을 위한 김도원의 연락처입니다.",
    },
    en: {
      title: "Contact | Kim Dowon",
      description: "Contact Kim Dowon about AI agent development and frontend product engineering.",
    },
  });
}

export default function ContactPage() {
  return <Portfolio page="contact" />;
}
