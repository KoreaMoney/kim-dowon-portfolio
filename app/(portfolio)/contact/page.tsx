import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";

export const metadata: Metadata = {
  title: "Contact | 김도원",
  description: "AI Agent 구축과 Frontend 제품 개발 협업을 위한 김도원의 연락처입니다.",
};

export default function ContactPage() {
  return <Portfolio page="contact" />;
}
