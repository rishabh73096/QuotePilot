"use client";

import Link from "next/link";
import { BadgeCheck, CalendarX2, MessageSquareWarning, Send } from "lucide-react";
import { FeatureGate } from "@/components/billing/feature-gate";
import { Grid } from "@/components/charts/chart-card";
import { StatCard } from "@/components/charts/stat-card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { useMounted } from "@/hooks/use-mounted";
import { useNow } from "@/hooks/use-now";
import { formatInr } from "@/lib/format";
import { effectiveStatus, expiresInDays, quoteLabel } from "@/lib/quotes";
import { useQuotes } from "@/services/quotes";
import type { Quote, QuoteStatus } from "@/types/quote";

function Lane({ title, hint, quotes, tone, now, showExpiry }: { title: string; hint: string; quotes: Quote[]; tone: "blue" | "amber" | "green" | "red"; now: number; showExpiry?: boolean }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between"><h2 className="text-base font-bold text-ink">{title}</h2><Badge tone={tone} size="sm">{quotes.length}</Badge></div>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {quotes.slice(0, 8).map((q) => {
          const d = expiresInDays(q, now);
          return (
            <li key={q.id}>
              <Link href={`/quotes/${q.id}`} className="flex items-center justify-between gap-3 py-2.5 transition-transform duration-200 hover:translate-x-1">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{quoteLabel(q)} · {q.customerName}</span>{q.revisionNote ? <span className="block truncate text-xs text-amber-700">“{q.revisionNote}”</span> : <span className="block text-xs text-slate-500">{q.serviceName}</span>}</span>
                <span className="shrink-0 text-right"><span className="block text-sm font-semibold text-ink">{formatInr(q.total)}</span>{showExpiry && d !== null ? <span className="block text-xs text-slate-400">{d <= 0 ? "today" : `${d}d left`}</span> : null}</span>
              </Link>
            </li>
          );
        })}
        {quotes.length === 0 ? <li className="py-6 text-center text-sm text-slate-400">Nothing here.</li> : null}
      </ul>
    </Panel>
  );
}

function Body() {
  const mounted = useMounted();
  const now = useNow();
  const { quotes } = useQuotes();
  if (!mounted) return null;
  const by = (s: QuoteStatus) => quotes.filter((q) => effectiveStatus(q, now) === s);
  const sent = by("sent").sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""));
  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="See who said yes, who wants changes, and what is about to expire." />
      <Grid cols={4}>
        <StatCard icon={Send} label="Awaiting reply" value={String(sent.length)} href="/quotes" />
        <StatCard icon={BadgeCheck} label="Approved" value={String(by("approved").length)} sub={formatInr(by("approved").reduce((n, q) => n + q.total, 0))} />
        <StatCard icon={MessageSquareWarning} label="Revision asked" value={String(by("revision").length)} tone={by("revision").length ? "red" : undefined} />
        <StatCard icon={CalendarX2} label="Expired" value={String(by("expired").length)} />
      </Grid>
      <div className="grid gap-6 lg:grid-cols-2">
        <Lane title="Awaiting reply" hint="Soonest to expire first" quotes={sent} tone="blue" now={now} showExpiry />
        <Lane title="Revision requested" hint="The customer asked for a change" quotes={by("revision")} tone="amber" now={now} />
        <Lane title="Approved" hint="Ready to book" quotes={by("approved")} tone="green" now={now} />
        <Lane title="Expired" hint="No answer before the date" quotes={by("expired")} tone="red" now={now} />
      </div>
    </div>
  );
}

export function ApprovalsView() {
  return <FeatureGate feature="approvals"><Body /></FeatureGate>;
}
