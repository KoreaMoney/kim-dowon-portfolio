"use client";

import { useLocale } from "@/components/locale-provider";

export function RouteLoader() {
  const { locale } = useLocale();

  return <main id="main" className="route-loader" role="status" aria-live="polite" aria-label={locale === "en" ? "Loading page" : "페이지를 불러오는 중"}>
    <div><span>BUILD TRACE</span><strong>route.resolve()</strong><i aria-hidden="true" /><strong>component.render()</strong><i aria-hidden="true" /><strong>render.ready</strong></div>
  </main>;
}
