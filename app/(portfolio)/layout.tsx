import { SiteShell } from "@/components/portfolio";

export default function PortfolioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>
    {/* first-paint veil: visible only on a first visit (html.ocean-first) and
        hidden once the real intro mounts (html.ocean-booted) */}
    <div className="ocean-preveil" aria-hidden="true"><p>LOADING OCEAN<span className="ocean-dots"><i>.</i><i>.</i><i>.</i></span></p></div>
    <noscript><style>{".ocean-preveil{display:none!important}"}</style></noscript>
    <SiteShell>{children}</SiteShell>
  </>;
}
