import type { Metadata } from "next";
import { PublicQuoteView } from "@/components/quotes/public-quote";

export const metadata: Metadata = { title: "Your quote", robots: { index: false, follow: false } };

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PublicQuoteView token={token} />;
}
