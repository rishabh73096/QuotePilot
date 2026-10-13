"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { animate } from "motion/react";
import { BadgeCheck, Check, Send } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// A scripted job. Each frame changes what the "customer" asked for; the total is plain arithmetic, like the real engine.
const BASE = 2500;
const PER_ROOM = 600;
const PER_BATH = 300;
const FRAMES = [
  { rooms: 2, baths: 1, oven: false, carpet: false, stage: "draft" },
  { rooms: 3, baths: 1, oven: false, carpet: false, stage: "draft" },
  { rooms: 3, baths: 2, oven: false, carpet: false, stage: "draft" },
  { rooms: 3, baths: 2, oven: true, carpet: false, stage: "draft" },
  { rooms: 3, baths: 2, oven: true, carpet: true, stage: "draft" },
  { rooms: 3, baths: 2, oven: true, carpet: true, stage: "sent" },
  { rooms: 3, baths: 2, oven: true, carpet: true, stage: "approved" },
] as const;

const totalOf = (f: (typeof FRAMES)[number]) => BASE + f.rooms * PER_ROOM + f.baths * PER_BATH + (f.oven ? 500 : 0) + (f.carpet ? 800 : 0);

function Ticker({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = inr(value);
      last.current = value;
      return;
    }
    const controls = animate(last.current, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = inr(v)) });
    last.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return <span ref={ref}>{inr(value)}</span>;
}

export function HeroQuote() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(FRAMES.length - 1);

  useEffect(() => {
    if (reduced) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the scripted loop after hydration
    setI(0);
    const id = window.setInterval(() => setI((n) => (n + 1) % FRAMES.length), 2300);
    return () => window.clearInterval(id);
  }, [reduced]);

  const f = FRAMES[i];
  const rows = [
    { label: "Base clean", detail: "End of tenancy", amount: BASE, on: true },
    { label: "Rooms", detail: `${f.rooms} × ₹${PER_ROOM}`, amount: f.rooms * PER_ROOM, on: true },
    { label: "Bathrooms", detail: `${f.baths} × ₹${PER_BATH}`, amount: f.baths * PER_BATH, on: true },
    { label: "Oven clean", detail: "Add-on", amount: 500, on: f.oven },
    { label: "Carpet shampoo", detail: "Add-on", amount: 800, on: f.carpet },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[460px]" aria-label="Animated example of a QuotePilot quote">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_70%_20%,rgba(232,89,12,0.14),transparent_70%)]" />
      <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(30,20,10,0.35)] sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Quote #1042</p>
            <p className="mt-1 text-lg font-semibold text-ink">Meera Kapoor</p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.span key={f.stage} initial={{ opacity: 0, scale: 0.8, rotate: -6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", f.stage === "approved" ? "bg-emerald-50 text-emerald-700" : f.stage === "sent" ? "bg-orange-50 text-brand" : "bg-slate-100 text-slate-500")}>
              {f.stage === "approved" ? <BadgeCheck className="size-3.5" /> : f.stage === "sent" ? <Send className="size-3.5" /> : null}
              {f.stage === "approved" ? "Approved" : f.stage === "sent" ? "Sent" : "Draft"}
            </m.span>
          </AnimatePresence>
        </div>

        <ul className="mt-6 divide-y divide-slate-100 text-sm">
          <AnimatePresence initial={false}>
            {rows.filter((r) => r.on).map((r) => (
              <m.li key={r.label} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="flex items-center justify-between py-3">
                  <span><span className="font-medium text-ink">{r.label}</span><span className="ml-2 text-xs text-slate-400">{r.detail}</span></span>
                  <span className="font-semibold text-ink tabular-nums">{inr(r.amount)}</span>
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="mt-2 flex items-end justify-between border-t-2 border-ink/90 pt-4">
          <span className="text-sm font-semibold text-ink">Total</span>
          <span className="font-inter text-4xl font-semibold tracking-[-0.04em] text-ink tabular-nums"><Ticker value={totalOf(f)} /></span>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#faf6f1] px-4 py-3 text-xs text-slate-500">
          <Check className="text-brand size-3.5 shrink-0" />
          Calculated from your rules. Valid for 7 days.
        </div>
      </div>

      <m.div aria-hidden animate={reduced ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-3 -bottom-5 hidden rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-xs shadow-[0_20px_40px_-20px_rgba(30,20,10,0.35)] sm:block">
        <span className="font-semibold text-ink">Customer replied</span>
        <span className="mt-0.5 block text-slate-500">“Looks good, approve it.”</span>
      </m.div>
    </div>
  );
}
