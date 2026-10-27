import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
import { getLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
      title: "Engineering Practice | 김도원",
      description: "문제 관찰, 구조 설계, 검증으로 이어진 김도원의 제품 개발 방식과 코드 품질 원칙입니다.",
    },
    en: {
      title: "Engineering Practice | Kim Dowon",
      description: "Kim Dowon develops products by observing the problem, structuring the system, and validating the result with clear code-quality standards.",
    },
  });
}

export default function ProcessPage() {
  return <Portfolio page="process" />;
}
