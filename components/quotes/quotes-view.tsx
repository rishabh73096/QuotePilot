"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilePlus2, FileText, IndianRupee, Percent, Trash2 } from "lucide-react";
import { Grid } from "@/components/charts/chart-card";
import { StatCard } from "@/components/charts/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CountTabs } from "@/components/ui/count-tabs";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useMounted } from "@/hooks/use-mounted";
import { useNow } from "@/hooks/use-now";
import { formatInr } from "@/lib/format";
import { useFlashing } from "@/lib/flash";
import { approvalRate, effectiveStatus, quoteLabel, statusMeta, STATUSES } from "@/lib/quotes";
import { perDay, sum } from "@/lib/stats";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { deleteQuote, useQuotes } from "@/services/quotes";
import type { Quote, QuoteStatus } from "@/types/quote";

type Filter = "all" | QuoteStatus;

export function QuotesView() {
  const mounted = useMounted();
  const now = useNow();
  const flashing = useFlashing();
  const { quotes, loaded } = useQuotes();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const tabs = useMemo(
    () => [{ value: "all" as Filter, label: "All", count: quotes.length }, ...STATUSES.map((s) => ({ value: s.value as Filter, label: s.label, count: quotes.filter((q) => effectiveStatus(q, now) === s.value).length }))],
    [quotes, now],
  );
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((x) => (filter === "all" || effectiveStatus(x, now) === filter) && (!q || `${quoteLabel(x)} ${x.customerName} ${x.serviceName}`.toLowerCase().includes(q)));
  }, [quotes, filter, query, now]);

  const columns: Column<Quote>[] = [
    { id: "quote", header: "Quote", cell: (q) => <Link href={`/quotes/${q.id}`} className="font-semibold text-ink hover:text-brand hover:underline">{quoteLabel(q)}</Link> },
    { id: "customer", header: "Customer", cell: (q) => <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{q.customerName}</p><p className="truncate text-xs text-slate-500">{q.customerPhone || q.customerEmail || "—"}</p></div> },
    { id: "service", header: "Service", cell: (q) => <span className="text-sm text-ink">{q.serviceName || "—"}</span> },
    { id: "total", header: "Total", cell: (q) => <span className="text-sm font-semibold text-ink">{formatInr(q.total)}</span> },
    { id: "status", header: "Status", cell: (q) => { const m = statusMeta(effectiveStatus(q, now)); return <Badge tone={m.tone} dot>{m.label}</Badge>; } },
    { id: "date", header: "Created", cell: (q) => <span className="text-xs text-slate-500">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span> },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (q) => (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="icon" aria-label={`Delete quote ${quoteLabel(q)}`} onClick={() => { if (window.confirm(`Delete quote ${quoteLabel(q)}?`)) { deleteQuote(q.id); notify.success("Quote deleted"); } }}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  if (!mounted) return null;
  const rate = approvalRate(quotes);

  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description="Every quotation in one place, with its status." actions={<Link href="/quotes/new" className={cn(buttonVariants({ variant: "brand", size: "xl" }), "rounded-full px-6")}><FilePlus2 />New quote</Link>} />
      <Grid cols={4}>
        <StatCard icon={FileText} label="Total quotes" value={String(quotes.length)} spark={perDay(quotes, (q) => q.createdAt, 14, now).map((p) => p.value)} />
        <StatCard icon={FilePlus2} label="This week" value={String(sum(perDay(quotes, (q) => q.createdAt, 7, now).map((p) => p.value)))} sub="Last 7 days" />
        <StatCard icon={IndianRupee} label="Open value" value={formatInr(sum(quotes.filter((q) => effectiveStatus(q, now) === "sent").map((q) => q.total)))} sub="Awaiting a reply" />
        <StatCard icon={Percent} label="Approval rate" value={rate === null ? "—" : `${rate}%`} sub="Approved of answered" />
      </Grid>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CountTabs label="Filter by status" tabs={tabs} value={filter} onChange={setFilter} />
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search number, customer, service" clearable tone="white" className="w-full lg:w-72" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowId={(q) => q.id}
        selectable={false}
        pageSize={8}
        rowClassName={(q) => (flashing.has(q.id) ? "row-flash" : undefined)}
        emptyMessage={!loaded ? "Loading quotes…" : quotes.length ? "No quotes match these filters." : "No quotes yet. Create your first one."}
        footerLabel={({ from, to, total }) => <>Showing <b className="text-ink">{from}–{to}</b> of <b className="text-ink">{total}</b> quotes</>}
      />
    </div>
  );
}
