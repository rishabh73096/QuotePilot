"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarX2, FilePlus2, FileText, IndianRupee, Percent } from "lucide-react";
import { AreaTrend, BarsH, Columns, STAGE_COLORS } from "@/components/charts/charts";
import { ChartCard, Grid } from "@/components/charts/chart-card";
import { StatCard } from "@/components/charts/stat-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useAuth } from "@/context/AuthContext";
import { useMounted } from "@/hooks/use-mounted";
import { useNow } from "@/hooks/use-now";
import { formatInr } from "@/lib/format";
import { approvalRate, effectiveStatus, expiresInDays, expiringSoon, quoteLabel } from "@/lib/quotes";
import { perDay, statusCounts, statusValues, sum } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { useQuoteEvents, useQuotes } from "@/services/quotes";

const compactInr = (n: number) => (n >= 100000 ? `₹${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${+(n / 1000).toFixed(1)}K` : `₹${n}`);

export function Overview() {
  const mounted = useMounted();
  const now = useNow();
  const user = useAuth();
  const { quotes } = useQuotes();
  const events = useQuoteEvents();

  if (!mounted) return null;

  const awaiting = quotes.filter((q) => effectiveStatus(q, now) === "sent");
  const soon = expiringSoon(quotes, 3, now);
  const approvedValue = sum(quotes.filter((q) => q.status === "approved").map((q) => q.total));
  const rate = approvalRate(quotes);
  const trend = perDay(quotes, (q) => q.createdAt, 14, now);
  const statuses = statusCounts(quotes, now).map((s) => ({ label: s.label, value: s.value, color: STAGE_COLORS[s.key] }));
  const values = statusValues(quotes, now).map((s) => ({ label: s.label, value: s.value, color: STAGE_COLORS[s.key] }));
  const first = user?.fullName?.split(" ")[0];
  const labelOf = (id: string) => { const q = quotes.find((x) => x.id === id); return q ? `${quoteLabel(q)} ${q.customerName}` : "Deleted quote"; };

  return (
    <div className="space-y-6">
      <PageHeader
        title={first ? `Hi ${first}, here’s today` : "Today"}
        description="Quotes waiting on a customer, and what is about to expire."
        actions={<Link href="/quotes/new" className={cn(buttonVariants({ variant: "brand", size: "xl" }), "rounded-full px-6")}><FilePlus2 />New quote</Link>}
      />

      <Grid cols={4}>
        <StatCard icon={FileText} label="Total quotes" value={String(quotes.length)} sub={`${awaiting.length} awaiting a reply`} spark={trend.map((p) => p.value)} href="/quotes" />
        <StatCard icon={CalendarX2} label="Expiring soon" value={String(soon.length)} sub="Within 3 days" tone={soon.length ? "red" : undefined} href="/approvals" />
        <StatCard icon={IndianRupee} label="Approved value" value={formatInr(approvedValue)} sub={`${formatInr(sum(awaiting.map((q) => q.total)))} still open`} href="/approvals" />
        <StatCard icon={Percent} label="Approval rate" value={rate === null ? "—" : `${rate}%`} sub="Approved of answered" href="/approvals" />
      </Grid>

      <Grid cols={2}>
        <ChartCard title="Quotes created" description="Last 14 days" table={{ head: ["Day", "Quotes"], rows: trend.map((p) => [p.label, p.value]) }}>
          <AreaTrend data={trend} name="Quotes" />
        </ChartCard>
        <ChartCard title="Quotes by status" description="Where every quote stands" table={{ head: ["Status", "Quotes"], rows: statuses.map((s) => [s.label, s.value]) }}>
          <BarsH data={statuses} name="Quotes" height={220} />
        </ChartCard>
      </Grid>

      <Grid cols={2}>
        <ChartCard title="Value by status" description="Total ₹ of quotes in each status" table={{ head: ["Status", "Value"], rows: values.map((s) => [s.label, formatInr(s.value)]) }}>
          <Columns data={values} series={[{ key: "value", name: "Value", color: "var(--viz-1)" }]} format={compactInr} />
        </ChartCard>

        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Expiring soon" description="Nudge these customers first." icon={CalendarX2} aside={<Link href="/approvals" className="text-brand inline-flex items-center gap-1 text-sm font-semibold hover:underline">All approvals<ArrowRight className="size-3.5" /></Link>} />
          {soon.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">Nothing is about to expire.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {soon.slice(0, 6).map((q) => {
                const d = expiresInDays(q, now) ?? 0;
                return (
                  <li key={q.id}>
                    <Link href={`/quotes/${q.id}`} className="group flex items-center justify-between gap-3 py-3 transition-transform duration-200 hover:translate-x-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{quoteLabel(q)} · {q.customerName}</p>
                        <p className="truncate text-xs text-slate-500">{formatInr(q.total)} · {q.serviceName}</p>
                      </div>
                      <Badge tone="red" size="sm">{d <= 0 ? "Expires today" : `${d} day${d > 1 ? "s" : ""} left`}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </Grid>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Recent activity" icon={BadgeCheck} />
        {events.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Activity appears here as you create and send quotes.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {events.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate text-ink"><b>{labelOf(e.quoteId)}</b> · {e.body}</span>
                <span className="shrink-0 text-xs text-slate-400">{new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
