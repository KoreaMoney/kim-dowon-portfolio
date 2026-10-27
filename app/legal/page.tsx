import Link from "next/link";

export const metadata = { title: "Privacy & Terms | 김도원" };

export default function LegalPage() {
  return (
    <main className="legal-page">
      <p className="section-kicker">PRIVACY · TERMS</p>
      <h1>개인정보 및 이용 안내</h1>
      <section><h2>수집하는 정보</h2><p>이 사이트는 별도 회원 가입, 분석 쿠키, 사용자 추적 기능을 사용하지 않습니다. 이메일 링크를 통해 연락하면 메일 서비스의 정책이 적용됩니다.</p></section>
      <section><h2>콘텐츠 이용</h2><p>포트폴리오의 글과 디자인은 김도원의 경력 소개를 위해 제공합니다. 프로젝트 상표와 서비스명은 각 소유자에게 권리가 있습니다.</p></section>
      <section><h2>문의</h2><p>콘텐츠 정정과 개인정보 문의는 kimdowon1404@gmail.com 또는 010-9076-2409로 연락해 주세요.</p></section>
      <Link href="/">포트폴리오로 돌아가기</Link>
    </main>
  );
}
