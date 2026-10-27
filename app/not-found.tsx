"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";

export default function NotFound() {
  const { locale } = useLocale();
  const isEnglish = locale === "en";

  return (
    <main className="not-found">
      <section className="not-found-copy">
        <p className="section-kicker">ROUTE NOT FOUND · 404</p>
        <h1>
          <span>{isEnglish ? "This route does not exist," : "요청한 경로는 없지만,"}</span>
          <span>{isEnglish ? "but the next step is clear." : "다음 선택은 분명합니다."}</span>
        </h1>
        <p>
          {isEnglish
            ? "Check the address, or continue to the project and career records. These routes will get you back on track."
            : "주소를 다시 확인하거나 프로젝트와 경력 기록으로 이동해 주세요. 현재 페이지에서 이어갈 수 있는 경로만 남겼습니다."}
        </p>
        <div className="not-found-actions">
          <Link href="/"><ArrowLeftIcon size={18} /> {isEnglish ? "Back to overview" : "처음으로"}</Link>
          <Link href="/work">{isEnglish ? "View projects" : "프로젝트 보기"} <ArrowUpRightIcon size={17} /></Link>
          <Link href="/career">{isEnglish ? "View career" : "경력 보기"} <ArrowUpRightIcon size={17} /></Link>
        </div>
      </section>
      <aside className="not-found-console" aria-label={isEnglish ? "Route recovery status" : "경로 복구 상태"}>
        <header><span>$ route.resolve()</span><b>FAILED</b></header>
        <div><span>REQUEST</span><code>/unknown</code></div>
        <div><span>STATUS</span><code>404 / not_found</code></div>
        <div><span>RECOVERY</span><code>overview → work → career</code></div>
        <footer><i aria-hidden="true" /><span>safe route suggestions ready</span></footer>
      </aside>
    </main>
  );
}
