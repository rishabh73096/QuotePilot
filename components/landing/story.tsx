"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { BadgeCheck, Link2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingContent } from "@/types/landing";

const EASE = [0.22, 1, 0.36, 1] as const;

function RulesVisual() {
  const rows = [["Base price", "₹2,500"], ["Per room", "₹600"], ["Per bathroom", "₹300"], ["Minimum job", "₹3,500"], ["Travel charge", "₹200"]];
  return (
    <div className="space-y-2.5">
      {rows.map(([k, v], i) => (
        <m.div key={k} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }} className="flex items-center justify-between rounded-2xl bg-[#faf6f1] px-5 py-3.5 text-sm">
          <span className="text-slate-500">{k}</span><span className="font-semibold text-ink tabular-nums">{v}</span>
        </m.div>
      ))}
    </div>
  );
}

function BuildVisual() {
  const [n, setN] = useState(3);
  return (
    <div>
      <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Rooms</p>
      <div className="mt-2 flex items-center gap-4">
        <button type="button" aria-label="Fewer rooms" onClick={() => setN((v) => Math.max(1, v - 1))} className="flex size-10 items-center justify-center rounded-full border border-slate-200 transition active:scale-90 hover:bg-slate-50"><Minus className="size-4" /></button>
        <m.span key={n} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-8 text-center text-3xl font-semibold text-ink tabular-nums">{n}</m.span>
        <button type="button" aria-label="More rooms" onClick={() => setN((v) => Math.min(9, v + 1))} className="flex size-10 items-center justify-center rounded-full border border-slate-200 transition active:scale-90 hover:bg-slate-50"><Plus className="size-4" /></button>
      </div>
      <div className="mt-6 flex items-end justify-between border-t-2 border-ink pt-4">
        <span className="text-sm font-semibold">Total</span>
        <m.span key={n} initial={{ scale: 0.92, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-semibold tracking-[-0.04em] tabular-nums">₹{(2500 + n * 600 + 300).toLocaleString("en-IN")}</m.span>
      </div>
      <p className="mt-3 text-xs text-slate-400">Try it: 2,500 + {n} × 600 + 300 for one bathroom.</p>
    </div>
  );
}

function SendVisual() {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl bg-[#faf6f1] p-2 pl-4 text-xs text-slate-500"><Link2 className="size-4 shrink-0" /><span className="truncate">quotepilot.ai/q/9f3a…c21e</span><span className="ml-auto rounded-xl bg-white px-3 py-1.5 font-semibold text-ink shadow-sm">Copy</span></div>
      <div className="mt-6 space-y-3">
        {[["Sent", "Valid for 7 days", false], ["Customer opened the link", "2 minutes later", false], ["Approved", "“Looks good, book Saturday.”", true]].map(([t, s, ok], i) => (
          <m.div key={String(t)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.35, duration: 0.45, ease: EASE }} className="flex items-start gap-3">
            <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}><BadgeCheck className="size-3.5" /></span>
            <span><span className="block text-sm font-semibold text-ink">{String(t)}</span><span className="text-xs text-slate-500">{String(s)}</span></span>
          </m.div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = [RulesVisual, BuildVisual, SendVisual];

export function Story({ c }: { c: Pick<LandingContent["story"], "title" | "sub"> & { steps: { title: string; body: string }[] } }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const Visual = VISUALS[active];
  return (
    <section id="how" className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="max-w-[640px]">
        <h2 className="font-inter text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">{c.title}</h2>
        <p className="mt-4 text-lg text-slate-500">{c.sub}</p>
      </div>
      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_440px] lg:gap-20">
        <ol className="space-y-6 lg:space-y-0">
          {c.steps.map((s, i) => (
            <li key={s.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className="lg:flex lg:min-h-[46vh] lg:items-center">
              <div className={cn("transition-opacity duration-500", active === i ? "opacity-100" : "lg:opacity-35")}>
                <span className="text-brand text-sm font-semibold">Step {i + 1}</span>
                <h3 className="font-inter mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">{s.title}</h3>
                <p className="mt-3 max-w-[460px] text-[17px] leading-8 text-slate-500">{s.body}</p>
                <div className="mt-6 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-sm lg:hidden">{(() => { const V = VISUALS[i]; return <V />; })()}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="hidden lg:block">
          <div className="sticky top-28 rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-[0_40px_80px_-50px_rgba(30,20,10,0.4)]">
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EASE }} className="min-h-[300px]">
                <Visual />
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
