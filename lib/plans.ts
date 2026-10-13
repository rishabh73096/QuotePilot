// What each plan includes. Keep in sync with config/landing.ts (pricing cards) and supabase/migrations/0006_plan_features.sql.
export type PlanName = "Starter" | "Pro";

export type Feature = "quotes" | "pricingRules" | "addons" | "pdf" | "customers" | "branding" | "shareLink" | "approvals" | "aiProposals";

export const FEATURE_LABELS: Record<Feature, string> = {
  quotes: "Quote form with live total",
  pricingRules: "Services and pricing rules",
  addons: "Add-ons",
  pdf: "PDF export",
  customers: "Customer list",
  branding: "Your branding on quotes",
  shareLink: "Share link for customers",
  approvals: "Approval and expiry tracking",
  aiProposals: "AI-written proposals (English + Hindi)",
};

const STARTER: Feature[] = ["quotes", "pricingRules", "addons", "pdf", "customers"];

export const PLAN_FEATURES: Record<PlanName, Feature[]> = {
  Starter: STARTER,
  Pro: [...STARTER, "branding", "shareLink", "approvals", "aiProposals"],
};

export const ALL_FEATURES = Object.keys(FEATURE_LABELS) as Feature[];

// Quotes created per month
export const PLAN_QUOTE_CAP: Record<PlanName, number> = { Starter: 50, Pro: 500 };

export const isPlanName = (v: unknown): v is PlanName => v === "Starter" || v === "Pro";
export const planHas = (plan: string | null | undefined, f: Feature) => (isPlanName(plan) ? PLAN_FEATURES[plan].includes(f) : false);
export const lowestPlanWith = (f: Feature): PlanName => (PLAN_FEATURES.Starter.includes(f) ? "Starter" : "Pro");
