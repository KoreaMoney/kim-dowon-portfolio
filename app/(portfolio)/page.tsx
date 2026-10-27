import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";

export const metadata: Metadata = {
  title: "김도원 | 제품 흐름을 만드는 Frontend · AI Agent 개발자",
  description: "사용자의 말을 완료된 일로 바꾸는 Frontend와 AI Agent 제품 개발자 김도원의 포트폴리오입니다.",
};

export default function HomePage() {
  return <Portfolio page="home" />;
}
