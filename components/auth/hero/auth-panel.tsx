import { HeroQuote } from "@/components/landing/hero-quote";
import { Logo } from "@/components/ui/logo";
import type { AuthHeroData } from "@/types/content";

// Left side of the sign-in / sign-up pages: calm brand panel with the live quote demo.
export function AuthPanel({ content }: { content: AuthHeroData }) {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#f6f2ec] p-12 lg:flex xl:p-16">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(232,89,12,0.12),transparent)]" />
      <Logo />
      <div className="relative my-12">
        <h2 className="font-inter max-w-[520px] text-[clamp(2.2rem,3.6vw,3.4rem)] leading-[1.04] font-semibold tracking-[-0.045em] text-ink">
          {content.headline} <span className="text-brand">{content.headlineAccent}</span>
        </h2>
        <p className="mt-5 max-w-[440px] text-lg leading-8 text-slate-500">{content.description}</p>
        <div className="mt-12 origin-top-left scale-[0.92]"><HeroQuote /></div>
      </div>
      <ul className="relative flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
        {content.trust.map((t) => (
          <li key={t.title}><span className="font-semibold text-ink">{t.title}</span> · {t.caption}</li>
        ))}
      </ul>
    </aside>
  );
}
