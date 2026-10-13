import type { Metadata } from "next";
import { QuotesView } from "@/components/quotes/quotes-view";

export const metadata: Metadata = { title: "Quotes" };

export default function Page() {
  return <QuotesView />;
}
