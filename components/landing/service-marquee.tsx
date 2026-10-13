import type { LandingContent } from "@/types/landing";

// Logo-carousel style strip (same idea as Kobra's Logo Carousel, which is a paid component, so this one is our own).
// Pure CSS: the track holds two copies and slides by half its width; it pauses on hover and stops for reduced motion.
export function ServiceMarquee({ c }: { c: LandingContent["marquee"] }) {
  const loop = [...c.items, ...c.items];
  return (
    <section aria-label={c.label} className="border-y border-black/[0.05] py-9">
      <p className="mb-6 text-center text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{c.label}</p>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="marquee-scroll flex w-max gap-12 group-hover:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <li key={i} aria-hidden={i >= c.items.length} className="flex items-center gap-2.5 text-[17px] font-medium whitespace-nowrap text-slate-400 transition-colors hover:text-ink">
              <item.icon className="size-5" strokeWidth={1.8} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
