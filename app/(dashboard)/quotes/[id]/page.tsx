import type { Metadata } from "next";
import { QuoteDetail } from "@/components/quotes/quote-detail";

export const metadata: Metadata = { title: "Quote" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteDetail id={id} />;
}
