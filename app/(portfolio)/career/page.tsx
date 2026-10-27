import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";

export const metadata: Metadata = {
  title: "Career | 김도원",
  description: "반도체 현장 품질부터 3D Frontend와 AI Agent 제품까지 이어진 김도원의 5년 경력입니다.",
};

export default function CareerPage() {
  return <Portfolio page="career" />;
}
