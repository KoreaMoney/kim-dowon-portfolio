import { SiteShell } from "@/components/portfolio";

export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
