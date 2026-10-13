import type { AuthHeroData } from "@/types/content";

export const authHeroData: AuthHeroData = {
  headline: "Quote faster,",
  headlineAccent: "win more cleaning jobs",
  description: "Build quotes from your own pricing rules, let AI write the proposal, and track approval and expiry in one place.",
  categories: [
    { key: "pricing", label: "Pricing rules", caption: "Rooms, area, add-ons", icon: "layout-grid", tone: "blue", image: "/images/auth/pricing.svg", fallback: "linear-gradient(160deg,#9fb4c9,#4b5d70)" },
    { key: "proposal", label: "AI Proposal", caption: "Clear inclusions", icon: "sparkles", tone: "purple", image: "/images/auth/proposal.svg", fallback: "linear-gradient(160deg,#5b4bb7,#2b2060)" },
    { key: "pdf", label: "PDF & Link", caption: "Branded, shareable", icon: "file-text", tone: "orange", image: "/images/auth/pdf.svg", fallback: "linear-gradient(160deg,#c9893a,#6b4a2f)" },
    { key: "approve", label: "Approvals", caption: "Accept or revise", icon: "check", tone: "teal", image: "/images/auth/approve.svg", fallback: "linear-gradient(160deg,#6f8a4a,#2c4a3a)" },
    { key: "lang", label: "Hindi + English", caption: "Bilingual quotes", icon: "message-circle", tone: "green", image: "/images/auth/lang.svg", fallback: "linear-gradient(160deg,#274a78,#1f2733)" },
  ],
  trust: [
    { title: "Your price, not AI's", caption: "Rules set by you", icon: "shield-check" },
    { title: "Quote in minutes", caption: "Add-ons built in", icon: "zap" },
    { title: "Know what's pending", caption: "Expiry tracking", icon: "shield-half" },
  ],
};
