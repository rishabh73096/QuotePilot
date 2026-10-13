import type { Metadata } from "next";
import { Faq, FinalCta, Hero, LandingFooter, LandingNav, Pricing, Principle } from "@/components/landing/sections";
import { Scenarios } from "@/components/landing/scenarios";
import { ServiceMarquee } from "@/components/landing/service-marquee";
import { Story } from "@/components/landing/story";
import { JsonLd } from "@/components/seo/json-ld";
import { LANDING } from "@/config/landing";
import { BRAND, SEO, SITE_URL } from "@/config/site";
import { faqSchema, organizationSchema, softwareSchema, websiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SEO.title },
  description: SEO.description,
  keywords: SEO.keywords,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: { type: "website", url: SITE_URL, siteName: BRAND.name, locale: SEO.locale, title: SEO.title, description: SEO.description },
  twitter: { card: "summary_large_image", title: SEO.title, description: SEO.description },
};

export default function LandingPage() {
  return (
    <div className="bg-[#fcfaf7]">
      <JsonLd data={[organizationSchema(), websiteSchema(), softwareSchema(), faqSchema(LANDING.faq)]} />
      <LandingNav />
      <main>
        <Hero c={LANDING} />
        <ServiceMarquee c={LANDING.marquee} />
        <Story c={{ ...LANDING.story, steps: LANDING.story.steps.map(({ title, body }) => ({ title, body })) }} />
        <Principle c={LANDING.principle} />
        <Scenarios c={{ eyebrow: LANDING.audience.eyebrow, title: LANDING.audience.title, cards: LANDING.audience.cards.map(({ who, role, scenario }) => ({ who, role, scenario })) }} />
        <Pricing c={LANDING} />
        <Faq c={LANDING} />
        <FinalCta c={LANDING} />
      </main>
      <LandingFooter />
    </div>
  );
}
