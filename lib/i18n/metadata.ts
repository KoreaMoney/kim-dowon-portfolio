import type { Metadata } from "next";
import { cookies } from "next/headers";

type LocalizedMetadata = {
  ko: Metadata;
  en: Metadata;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function readLocaleCookie(): Promise<"ko" | "en"> {
  return (await cookies()).get("portfolio-locale")?.value === "en" ? "en" : "ko";
}

export async function getLocalizedMetadata({ ko, en }: LocalizedMetadata): Promise<Metadata> {
  const metadata = (await readLocaleCookie()) === "en" ? en : ko;
  return { metadataBase: new URL(siteUrl), ...metadata };
}
