import { FileCheck2 } from "lucide-react";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3011").replace(/\/$/, "");

export const BRAND = {
  icon: FileCheck2,
  name: "QuotePilot AI",
  prefix: "QuotePilot",
  accent: " AI",
  tagline: "Instant quotations for cleaning businesses",
  loginTagline: "Open your quotes and see which are awaiting approval.",
  signupTagline: "Send professional quotes in minutes, priced by your own rules.",
  appTitle: "QuotePilot AI",
};

export const SEO = {
  title: `${BRAND.name}: Send cleaning quotes in minutes`,
  description: "Quotation software for cleaning and home-service businesses in India. Your pricing rules calculate every quote, AI writes the proposal in English or Hindi, customers approve online. From ₹499/month.",
  keywords: [
    "cleaning quotation software India",
    "quote generator for cleaning business",
    "end of tenancy cleaning quote",
    "estimate software home services",
    "PDF quotation maker",
    "proposal software Hindi",
    "quote approval tracking",
    "small business quotation ₹499",
  ],
  locale: "en_IN",
  twitter: "",
};
