import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://koreamoney.github.io"),
  title: "김도원 | AI Agent & Frontend Engineer",
  description: "5년간 프론트엔드와 AI Agent를 구축하고 사용자 경험과 제품 가치를 연결한 개발자 김도원의 포트폴리오입니다.",
  keywords: ["김도원", "AI Agent", "Frontend", "React", "Next.js", "포트폴리오"],
  authors: [{ name: "김도원" }],
  openGraph: {
    title: "김도원 | AI Agent & Frontend Engineer",
    description: "업무의 흐름을 읽고, 제품으로 답하는 개발자",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "김도원 개발자 포트폴리오" }],
  },
  twitter: { card: "summary_large_image", title: "김도원 | AI Agent & Frontend Engineer", images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
