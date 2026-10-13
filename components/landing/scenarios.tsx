"use client";

import { CalendarX2, Home, Truck } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { LandingContent } from "@/types/landing";

// Kobra Carousel (free). Cards are illustrative scenarios, not customer reviews.
// Icons are looked up here by position: component functions cannot be passed from a server page into this client component.
const ICONS = [Home, Truck, CalendarX2];

export function Scenarios({ c }: { c: Pick<LandingContent["audience"], "eyebrow" | "title"> & { cards: { who: string; role: string; scenario: string }[] } }) {
  return (
    <section id="features" className="scroll-mt-20 bg-[#f6f2ec] py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <p className="text-brand text-sm font-semibold">{c.eyebrow}</p>
        <h2 className="font-inter mt-3 max-w-[640px] text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">{c.title}</h2>
        <Carousel opts={{ align: "start" }} className="mt-14">
          <CarouselContent>
            {c.cards.map((card, i) => { const Icon = ICONS[i % ICONS.length]; return (
              <CarouselItem key={card.who} className="basis-[88%] sm:basis-1/2 lg:basis-1/3">
                <article className="group flex h-full min-h-[300px] flex-col rounded-[28px] border border-black/[0.05] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-36px_rgba(30,20,10,0.4)]">
                  <span className="bg-brand/10 text-brand flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><Icon className="size-5" /></span>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-ink">{card.who}</h3>
                  <p className="text-sm text-slate-400">{card.role}</p>
                  <p className="mt-5 text-[15px] leading-7 text-slate-600">{card.scenario}</p>
                </article>
              </CarouselItem>
            ); })}
          </CarouselContent>
          <div className="mt-8 flex gap-2">
            <CarouselPrevious className="static translate-x-0 translate-y-0" />
            <CarouselNext className="static translate-x-0 translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
