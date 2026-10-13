import type { BadgeTone } from "@/components/ui/badge";
import { DAY_MS } from "@/lib/date";
import type { Quote, QuoteStatus } from "@/types/quote";

export const STATUSES: { value: QuoteStatus; label: string; tone: BadgeTone; color: string }[] = [
  { value: "draft", label: "Draft", tone: "slate", color: "#8b8f98" },
  { value: "sent", label: "Sent", tone: "blue", color: "#e8590c" },
  { value: "approved", label: "Approved", tone: "green", color: "#2f9e44" },
  { value: "revision", label: "Revision", tone: "amber", color: "#f59f00" },
  { value: "expired", label: "Expired", tone: "red", color: "#e5484d" },
];

export const statusMeta = (s: QuoteStatus) => STATUSES.find((x) => x.value === s)!;
export const quoteLabel = (q: Pick<Quote, "number">) => `#${q.number}`;

// 'sent' quotes past their expiry are shown as expired even before the database job marks them.
export const effectiveStatus = (q: Quote, now = Date.now()): QuoteStatus =>
  q.status === "sent" && q.expiresAt && new Date(q.expiresAt).getTime() < now ? "expired" : q.status;

export const isOpen = (q: Quote, now = Date.now()) => effectiveStatus(q, now) === "sent";

export const expiresInDays = (q: Quote, now = Date.now()) => (q.expiresAt ? Math.ceil((new Date(q.expiresAt).getTime() - now) / DAY_MS) : null);

export const expiringSoon = (quotes: Quote[], days = 3, now = Date.now()) =>
  quotes.filter((q) => isOpen(q, now)).filter((q) => (expiresInDays(q, now) ?? Infinity) <= days);

export const approvalRate = (quotes: Quote[]): number | null => {
  const approved = quotes.filter((q) => q.status === "approved").length;
  const closed = approved + quotes.filter((q) => q.status === "revision" || q.status === "expired").length;
  return closed === 0 ? null : Math.round((approved / closed) * 100);
};

export const shareUrl = (q: Pick<Quote, "token">, origin = typeof window !== "undefined" ? window.location.origin : "") => `${origin}/q/${q.token}`;
