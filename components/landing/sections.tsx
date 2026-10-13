import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Mail, Minus } from "lucide-react";
import { DesktopNav, MobileNav } from "@/components/landing/nav-menu";
import { HeroQuote } from "@/components/landing/hero-quote";
import { PressLink } from "@/components/landing/interactive";
import { Logo } from "@/components/ui/logo";
import { Reveal } from "@/components/ui/motion";
import { BRAND } from "@/config/site";
import { LEGAL_EMAIL } from "@/config/legal";
import { ALL_FEATURES, FEATURE_LABELS, PLAN_FEATURES } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { LandingContent } from "@/types/landing";

export const wrap = "mx-auto w-full max-w-7xl px-5 sm:px-8";
const h2 = "font-inter text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink";
const btnDark = "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 text-[15px] font-semibold text-white";
const btnLine = "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-7 text-[15px] font-semibold text-ink transition-colors hover:bg-black/[0.03]";

const NAV = [{ label: "How it works", href: "/#how" }, { label: "Who it's for", href: "/#features" }, { label: "Pricing", href: "/#pricing" }, { label: "FAQ", href: "/#faq" }];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 rounded-full border border-black/[0.06] bg-white/80 pr-2 pl-5 shadow-[0_12px_40px_-24px_rgba(30,20,10,0.35)] backdrop-blur-xl">
        <Logo />
        <div className="mx-auto hidden md:block"><DesktopNav links={NAV} /></div>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Link href="/login" className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-slate-600 hover:text-ink sm:inline-flex">Sign in</Link>
          <PressLink href="/signup" className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white">Get started</PressLink>
          <MobileNav links={NAV} />
        </div>
      </div>
    </header>
  );
}

export function Hero({ c }: { c: LandingContent }) {
  return (
    <section className={cn(wrap, "grid items-center gap-16 pt-16 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-24 lg:pb-32")}>
      <div>
        <Reveal as="p" className="text-brand mb-6 inline-flex items-center gap-2 text-sm font-semibold"><span className="dot-ping relative size-2 rounded-full bg-brand" />{c.eyebrow}</Reveal>
        <Reveal as="h1" delay={0.05} className="font-inter text-[clamp(2.7rem,6.6vw,5.4rem)] leading-[1] font-semibold tracking-[-0.05em] text-ink">
          {c.headline.lead} <span className="relative whitespace-nowrap text-brand">{c.headline.accent}<svg aria-hidden viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-2 h-2.5 w-full text-brand/40"><path d="M2 8 C 60 2, 120 12, 180 6 S 270 4, 298 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span> {c.headline.tail}
        </Reveal>
        <Reveal as="p" delay={0.12} className="mt-8 max-w-[520px] text-lg leading-8 text-slate-500 sm:text-xl">{c.subhead}</Reveal>
        <Reveal delay={0.18} className="mt-10 flex flex-wrap items-center gap-3">
          <PressLink href="/signup" className={btnDark}>Get started <ArrowRight className="size-4" /></PressLink>
          <Link href="/#how" className={btnLine}>See how it works</Link>
        </Reveal>
        <Reveal as="p" delay={0.24} className="mt-5 text-sm text-slate-400">{c.heroNote}</Reveal>
      </div>
      <Reveal delay={0.1} y={28}><HeroQuote /></Reveal>
    </section>
  );
}

export function Principle({ c }: { c: LandingContent["principle"] }) {
  return (
    <section className={cn(wrap, "py-28")}>
      <Reveal as="h2" className={cn(h2, "max-w-[820px] text-[clamp(2.4rem,6.5vw,4.8rem)]")}>
        {c.title} <span className="text-slate-300">{c.titleMuted}</span>
      </Reveal>
      <dl className="mt-20 grid gap-10 border-t border-black/[0.08] pt-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-black/[0.08]">
        {c.stats.map((s, i) => (
          <Reveal key={s.value} delay={i * 0.08} className="md:px-10 md:first:pl-0 md:last:pr-0">
            <dt className="font-inter text-6xl font-semibold tracking-[-0.05em] text-ink">{s.value}</dt>
            <dd className="mt-4 max-w-[260px] text-[17px] leading-7 text-slate-500">{s.label}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

export function Pricing({ c }: { c: LandingContent }) {
  const [starter, pro] = c.pricing.plans;
  const href = (name: string) => `/signup?next=${encodeURIComponent(`/choose-plan?plan=${name}`)}`;
  return (
    <section id="pricing" className={cn(wrap, "scroll-mt-20 py-28")}>
      <div className="max-w-[640px]">
        <h2 className={h2}>{c.pricing.title}</h2>
        <p className="mt-4 text-lg text-slate-500">{c.pricing.sub}</p>
      </div>
      <div className="mt-14 overflow-hidden rounded-[28px] border border-black/[0.07] bg-white">
        <div className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-black/[0.07]">
          <div className="p-5 sm:p-8" />
          {[starter, pro].map((p) => (
            <div key={p.name} className={cn("border-l border-black/[0.07] p-5 sm:p-8", p.featured && "bg-[#fff6ef]")}>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">{p.name}{p.featured ? <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">Popular</span> : null}</p>
              <p className="font-inter mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">{p.price}<span className="ml-1 text-xs font-normal tracking-normal text-slate-400">/mo</span></p>
              <p className="mt-2 hidden text-sm text-slate-500 sm:block">{p.tagline}</p>
              <PressLink hover={1.03} href={href(p.name)} className={cn("mt-5 inline-flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold", p.featured ? "bg-brand text-white" : "bg-ink text-white")}>Choose {p.name}</PressLink>
            </div>
          ))}
        </div>
        {ALL_FEATURES.map((f) => (
          <div key={f} className="grid grid-cols-[1.3fr_1fr_1fr] border-b border-black/[0.05] text-sm last:border-b-0">
            <div className="p-4 text-slate-600 sm:px-8">{FEATURE_LABELS[f]}</div>
            {(["Starter", "Pro"] as const).map((p) => (
              <div key={p} className={cn("flex items-center border-l border-black/[0.05] p-4 sm:px-8", p === "Pro" && "bg-[#fff6ef]/60")}>
                {PLAN_FEATURES[p].includes(f) ? <Check className="size-4 text-brand" aria-label="Included" /> : <Minus className="size-4 text-slate-300" aria-label="Not included" />}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-slate-400">Introductory test pricing for early customers. Prices in INR.</p>
    </section>
  );
}

export function Faq({ c }: { c: LandingContent }) {
  return (
    <section id="faq" className={cn(wrap, "scroll-mt-20 py-24")}>
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <h2 className={h2}>Questions</h2>
        <div className="divide-y divide-black/[0.08] border-y border-black/[0.08]">
          {c.faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink">
                {f.q}<ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-[620px] leading-7 text-slate-500 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-1 group-open:duration-300">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ c }: { c: LandingContent }) {
  return (
    <section className={cn(wrap, "py-24")}>
      <Reveal className="text-center">
        <h2 className="font-inter mx-auto max-w-[760px] text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-ink">{c.cta.title}</h2>
        <p className="mx-auto mt-5 max-w-[460px] text-lg text-slate-500">{c.cta.sub}</p>
        <PressLink href="/signup" hover={1.05} className={cn(btnDark, "mt-9 h-14 px-9 text-base")}>Get started <ArrowRight className="size-4" /></PressLink>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  const cols = [
    { title: "Product", links: [["How it works", "/#how"], ["Who it's for", "/#features"], ["Pricing", "/#pricing"], ["FAQ", "/#faq"]] },
    { title: "Account", links: [["Sign in", "/login"], ["Create account", "/signup"]] },
    { title: "Legal", links: [["Privacy Policy", "/privacy-policy"], ["Terms", "/terms-of-service"]] },
  ];
  return (
    <footer className="overflow-hidden border-t border-black/[0.06]">
      <div className={cn(wrap, "pt-16")}>
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-5 max-w-[280px] leading-7 text-slate-500">Quotations for cleaning businesses, priced by your own rules.</p>
            <p className="mt-4 font-mono text-xs text-slate-400">Plans from ₹499/mo · Pay by UPI</p>
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.map(([label, href]) => <li key={label}><Link href={href} className="inline-block text-[15px] text-slate-500 transition-all duration-200 hover:translate-x-1 hover:text-ink">{label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex items-center justify-between border-t border-black/[0.06] pt-8 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <a href={`mailto:${LEGAL_EMAIL}`} aria-label="Email support" className="flex size-11 items-center justify-center rounded-full bg-black/[0.05] text-ink transition-all duration-200 hover:scale-110 hover:bg-ink hover:text-white active:scale-90"><Mail className="size-[18px]" /></a>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none mt-6 select-none text-center">
        <p className="font-inter -mb-[0.12em] text-[clamp(56px,17vw,250px)] leading-[0.9] font-semibold tracking-[-0.06em] text-black/[0.045] [mask-image:linear-gradient(to_bottom,black_25%,transparent_92%)]">{BRAND.prefix.toLowerCase()}</p>
      </div>
    </footer>
  );
}
