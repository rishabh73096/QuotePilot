import { DAY_MS, addDays, startOfDay } from "@/lib/date";
import { STATUSES, effectiveStatus } from "@/lib/quotes";
import type { Quote } from "@/types/quote";

const dayLabel = (d: number) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export type DayPoint = { label: string; value: number };

export function perDay<T>(items: T[], at: (i: T) => string | null, days: number, now: number): DayPoint[] {
  const start = startOfDay(addDays(now, -(days - 1))).getTime();
  const out: DayPoint[] = Array.from({ length: days }, (_, i) => ({ label: dayLabel(start + i * DAY_MS), value: 0 }));
  for (const it of items) {
    const t = at(it);
    if (!t) continue;
    const idx = Math.floor((startOfDay(new Date(t)).getTime() - start) / DAY_MS);
    if (idx >= 0 && idx < days) out[idx].value++;
  }
  return out;
}

export const statusCounts = (quotes: Quote[], now = Date.now()) => STATUSES.map((s) => ({ key: s.value, label: s.label, value: quotes.filter((q) => effectiveStatus(q, now) === s.value).length }));

export const statusValues = (quotes: Quote[], now = Date.now()) => STATUSES.map((s) => ({ key: s.value, label: s.label, value: quotes.filter((q) => effectiveStatus(q, now) === s.value).reduce((n, q) => n + q.total, 0) }));

export const sum = (nums: number[]) => nums.reduce((a, b) => a + b, 0);

export const quotesThisMonth = (quotes: Quote[], now = Date.now()) => {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return quotes.filter((q) => new Date(q.createdAt).getTime() >= start).length;
};
