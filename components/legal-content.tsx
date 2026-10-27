"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { CONTACT } from "@/lib/contact";

export function LegalContent() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  return (
    <main className="legal-page">
      <p className="section-kicker">PRIVACY · TERMS</p>
      <h1>{isEnglish ? "Privacy & Terms" : "개인정보 및 이용 안내"}</h1>
      <section>
        <h2>{isEnglish ? "Information we collect" : "수집하는 정보"}</h2>
        <p>
          {isEnglish
            ? "This site does not require an account or use analytics cookies or user tracking. A preference cookie remembers your language for one year. Questions sent to the AI guide are processed by OpenAI to generate answers. If you contact me by email, your email provider's policies apply."
            : "이 사이트는 별도 회원 가입, 분석 쿠키, 사용자 추적 기능을 사용하지 않습니다. 언어 선택은 설정 쿠키에 1년간 저장됩니다. AI 안내에 보낸 질문은 답변 생성을 위해 OpenAI에서 처리됩니다. 이메일 링크를 통해 연락하면 메일 서비스의 정책이 적용됩니다."}
        </p>
      </section>
      <section>
        <h2>{isEnglish ? "Content use" : "콘텐츠 이용"}</h2>
        <p>
          {isEnglish
            ? "The writing and design on this portfolio present Kim Dowon's professional experience. Project trademarks and service names belong to their respective owners."
            : "포트폴리오의 글과 디자인은 김도원의 경력 소개를 위해 제공합니다. 프로젝트 상표와 서비스명은 각 소유자에게 권리가 있습니다."}
        </p>
      </section>
      <section>
        <h2>{isEnglish ? "Contact" : "문의"}</h2>
        <p>
          {isEnglish
            ? `For content corrections or privacy questions, contact ${CONTACT.email} or call ${CONTACT.phoneDisplay}.`
            : `콘텐츠 정정과 개인정보 문의는 ${CONTACT.email} 또는 ${CONTACT.phoneDisplay}로 연락해 주세요.`}
        </p>
      </section>
      <Link href="/">{isEnglish ? "Back to portfolio" : "포트폴리오로 돌아가기"}</Link>
    </main>
  );
}
