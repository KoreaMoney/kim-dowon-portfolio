import { RouteTransition } from "@/components/route-transition";

export default function PortfolioTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RouteTransition>{children}</RouteTransition>;
}
