import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-code">404</div>
      <p className="section-kicker">ROUTE NOT FOUND</p>
      <h1>이 경로에는<br />아직 결과물이 없습니다.</h1>
      <p>주소를 다시 확인하거나 포트폴리오의 첫 화면으로 돌아가 주세요.</p>
      <Link href="/"><ArrowLeftIcon size={18} /> 처음으로 돌아가기</Link>
    </main>
  );
}
