import type { Metadata } from "next";
import { BrandingView } from "@/components/branding/branding-view";

export const metadata: Metadata = { title: "Branding" };

export default function Page() {
  return <BrandingView />;
}
