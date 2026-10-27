import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";

export const metadata: Metadata = {
  title: "Engineering Practice | 김도원",
  description: "문제 관찰, 구조 설계, 검증으로 이어지는 김도원의 제품 개발 방식과 코드 품질 원칙입니다.",
};

export default function ProcessPage() {
  return <Portfolio page="process" />;
}
