import type { Metadata } from "next";
import { QuoteBuilder } from "@/components/quotes/quote-builder";

export const metadata: Metadata = { title: "New quote" };

export default function Page() {
  return <QuoteBuilder />;
}
