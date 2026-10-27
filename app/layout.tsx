import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/locale-provider";
import { getLocalizedMetadata, readLocaleCookie } from "@/lib/i18n/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return getLocalizedMetadata({
    ko: {
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
    },
    en: {
      title: "Kim Dowon | AI Agent & Frontend Engineer",
      description: "Kim Dowon's portfolio: five years building frontend and AI agent products that connect user experience with measurable product value.",
      keywords: ["Kim Dowon", "AI Agent", "Frontend Engineer", "React", "Next.js", "Portfolio"],
      authors: [{ name: "Kim Dowon" }],
      openGraph: {
        title: "Kim Dowon | AI Agent & Frontend Engineer",
        description: "Frontend and AI agent work grounded in product workflows and measurable outcomes.",
        type: "website",
        locale: "en_US",
        images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Kim Dowon developer portfolio" }],
      },
      twitter: { card: "summary_large_image", title: "Kim Dowon | AI Agent & Frontend Engineer", images: ["/opengraph-image"] },
    },
  });
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await readLocaleCookie();
  return <html lang={locale} data-scroll-behavior="smooth"><body><LocaleProvider initialLocale={locale}>{children}</LocaleProvider></body></html>;
}
