import type { Metadata } from "next";
import { LegalContent } from "@/components/legal-content";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "Privacy & Terms | 김도원",
      description: "김도원 포트폴리오의 개인정보, 콘텐츠 이용, 문의 안내입니다.",
    },
    en: {
      title: "Privacy & Terms | Kim Dowon",
      description: "Privacy, content use, and contact information for Kim Dowon's portfolio.",
    },
  });
}

export default function LegalPage() {
  return <LegalContent />;
}
