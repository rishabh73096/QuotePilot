import type { LucideIcon } from "lucide-react";

export interface Plan {
  name: string;
  tagline: string;
  price: string;
  features: string[];
  featured?: boolean;
}

export interface Step {
  title: string;
  body: string;
  icon: LucideIcon;
}

export interface LandingContent {
  eyebrow: string;
  headline: { lead: string; accent: string; tail: string };
  subhead: string;
  heroNote: string;
  marquee: { label: string; items: { label: string; icon: LucideIcon }[] };
  story: { title: string; sub: string; steps: Step[] };
  principle: { title: string; titleMuted: string; stats: { value: string; label: string }[] };
  audience: { eyebrow: string; title: string; cards: { who: string; role: string; scenario: string; icon: LucideIcon }[] };
  pricing: { title: string; sub: string; plans: Plan[] };
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
}
