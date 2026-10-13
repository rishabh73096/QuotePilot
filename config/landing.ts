import { Bath, BedDouble, Calculator, CalendarX2, FileText, Home, Link2, Paintbrush, Send, Sofa, SprayCan, Sparkles, Truck, WashingMachine, Wrench } from "lucide-react";
import type { LandingContent } from "@/types/landing";

export const LANDING: LandingContent = {
  eyebrow: "Quotation software for cleaning businesses",
  headline: { lead: "Quote the job", accent: "while they're", tail: "still on the phone." },
  subhead: "Set your prices once. QuotePilot calculates every quote from your own rules, writes the proposal, and tracks who said yes.",
  heroNote: "Totals come from your pricing rules. AI only writes the words.",
  marquee: {
    label: "Priced for the jobs you actually quote",
    items: [
      { label: "End of tenancy", icon: Home },
      { label: "Deep cleaning", icon: SprayCan },
      { label: "Carpet shampoo", icon: Sofa },
      { label: "Oven clean", icon: WashingMachine },
      { label: "Bathroom scrub", icon: Bath },
      { label: "Move-in clean", icon: BedDouble },
      { label: "Post-repair clean", icon: Paintbrush },
      { label: "Maintenance visit", icon: Wrench },
    ],
  },
  story: {
    title: "From a phone call to an approved quote.",
    sub: "Three steps. The first one you only do once.",
    steps: [
      { title: "Set your rules once", body: "Enter what you charge: a base price, a rate per room and bathroom, add-ons, a travel charge, a minimum job price. That is your pricing engine.", icon: Calculator },
      { title: "Build the quote in a minute", body: "Pick the service, type the rooms and tick the extras. The total updates as you go, and the line items always add up to it.", icon: FileText },
      { title: "Send it and see the answer", body: "Share a link or a PDF. The customer approves or asks for changes in one tap. Quotes nobody answers expire on their own.", icon: Send },
    ],
  },
  principle: {
    title: "Your price. Your rules.",
    titleMuted: "Never an AI guess.",
    stats: [
      { value: "0", label: "prices guessed by AI. Every total is your own arithmetic." },
      { value: "1 tap", label: "for a customer to approve or ask for a change." },
      { value: "2", label: "languages for the proposal text: English and Hindi." },
    ],
  },
  audience: {
    eyebrow: "Made for owners who quote on the phone",
    title: "Three kinds of jobs, one way to price them.",
    cards: [
      { who: "End-of-tenancy cleaner", role: "Prices by rooms and bathrooms", scenario: "A customer sends the property details. You get a priced quote with add-ons in under a minute.", icon: Home },
      { who: "Deep-cleaning team", role: "A different price per service", scenario: "Set the minimum job price and travel charge once. No more recalculating on a calculator.", icon: Truck },
      { who: "Maintenance contractor", role: "Quotes that expire", scenario: "A quote nobody answered expires on its own, and you see it on the dashboard first.", icon: CalendarX2 },
    ],
  },
  pricing: {
    title: "Pick a plan.",
    sub: "Prices are per month, in INR. Pay by UPI and your plan switches on once the payment is verified.",
    plans: [
      { name: "Starter", tagline: "For basic quotations.", price: "₹499", features: ["Services and pricing rules", "Quote form with add-ons", "PDF export", "Customer list"] },
      { name: "Pro", tagline: "For owners who send many quotes.", price: "₹799", featured: true, features: ["Everything in Starter", "Your branding on quotes", "Share link and approval tracking", "AI-written proposals in English and Hindi"] },
    ],
  },
  faq: [
    { q: "Does AI decide my price?", a: "No. Totals come from the pricing rules you set, and the database checks that every quote's total equals the sum of its line items. AI only writes the proposal text." },
    { q: "Can customers accept online?", a: "Yes, on the Pro plan. Each quote has a link where the customer can approve or request a revision, with no login." },
    { q: "Can you set up my price list?", a: "Yes. Optional one-time onboarding helps you enter your services and add-ons." },
    { q: "Which languages are supported?", a: "English and Hindi to start. More languages follow demand." },
    { q: "How do I pay?", a: "By UPI. Scan the QR, enter the transaction ID, and your plan is activated once we verify the payment." },
  ],
  cta: { title: "Your next quote is one phone call away.", sub: "Pick a plan and send your first quote today." },
};

// Icons used by the landing visuals but not tied to content.
export const LANDING_ICONS = { Link2, Sparkles };
