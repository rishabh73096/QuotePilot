import type { Metadata } from "next";
import { PricingView } from "@/components/pricing/pricing-view";

export const metadata: Metadata = { title: "Services & pricing" };

export default function Page() {
  return <PricingView />;
}
