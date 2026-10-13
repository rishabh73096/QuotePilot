"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Copy, Link2, Printer, Send, Sparkles, StickyNote } from "lucide-react";
import { UpgradeCard } from "@/components/billing/feature-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { useMounted } from "@/hooks/use-mounted";
import { useNow } from "@/hooks/use-now";
import { formatInr } from "@/lib/format";
import { usePlan } from "@/lib/plan-store";
import { draftProposal } from "@/lib/proposal";
import { effectiveStatus, quoteLabel, shareUrl, statusMeta } from "@/lib/quotes";
import { notify } from "@/lib/toast";
import { addQuoteNote, sendQuote, setQuoteStatus, updateQuote, useQuote, useQuoteEvents } from "@/services/quotes";
import { useSettings } from "@/services/settings";

export function QuoteDetail({ id }: { id: string }) {
  const mounted = useMounted();
  const router = useRouter();
  const now = useNow();
  const { can } = usePlan();
  const settings = useSettings();
  const { quote, loaded } = useQuote(id);
  const events = useQuoteEvents(id);
  const [note, setNote] = useState("");

  if (!mounted) return null;
  if (!quote) return <p className="text-sm text-slate-500">{loaded ? "This quote doesn't exist." : "Loading…"} <Link href="/quotes" className="text-brand font-semibold hover:underline">Back to quotes</Link></p>;

  const status = effectiveStatus(quote, now);
  const meta = statusMeta(status);
  const link = shareUrl(quote);

  const writeProposal = () => {
    updateQuote(quote.id, { proposal: draftProposal({ customerName: quote.customerName, serviceName: quote.serviceName, lineItems: quote.lineItems, total: quote.total, businessName: settings.businessName, language: quote.language, expiryDays: settings.rules.expiryDays }) });
    notify.success("Proposal written. Edit it before sending.");
  };
  const share = () => {
    sendQuote(quote.id, settings.rules.expiryDays);
    navigator.clipboard?.writeText(link).catch(() => {});
    notify.success("Quote marked as sent. Link copied.");
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <button type="button" onClick={() => router.push("/quotes")} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink"><ArrowLeft className="size-4" />All quotes</button>
        <PageHeader
          title={`Quote ${quoteLabel(quote)}`}
          badge={<Badge tone={meta.tone} dot>{meta.label}</Badge>}
          description={`${quote.customerName} · ${quote.serviceName}`}
          actions={<>
            <Button type="button" variant="neutral" size="xl" className="rounded-full px-5" onClick={() => window.print()}><Printer />PDF / Print</Button>
            {can("shareLink") ? <Button type="button" variant="brand" size="xl" className="rounded-full px-5" onClick={share} disabled={status === "approved"}><Send />{quote.status === "draft" ? "Mark sent and copy link" : "Re-send"}</Button> : null}
          </>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Panel className="p-6 sm:p-8 print:border-0 print:shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: settings.brand.color }}>{settings.businessName || "Quotation"}</p>
                <h2 className="mt-1 text-2xl font-semibold text-ink">Quote {quoteLabel(quote)}</h2>
                <p className="mt-1 text-sm text-slate-500">For {quote.customerName}{quote.customerAddress ? ` · ${quote.customerAddress}` : ""}</p>
              </div>
              <p className="text-right text-xs text-slate-400">{new Date(quote.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}{quote.expiresAt ? <><br />Valid until {new Date(quote.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</> : null}</p>
            </div>
            <table className="mt-6 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {quote.lineItems.map((l, i) => (
                  <tr key={i}><td className="py-2.5"><span className="font-medium text-ink">{l.label}</span><span className="block text-xs text-slate-500">{l.detail}</span></td><td className="py-2.5 text-right font-semibold text-ink">{l.amount < 0 ? "−" : ""}{formatInr(Math.abs(l.amount))}</td></tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-slate-200"><td className="pt-3 text-base font-bold text-ink">Total</td><td className="pt-3 text-right text-xl font-semibold text-ink">{formatInr(quote.total)}</td></tr></tfoot>
            </table>
            {quote.proposal ? <p className="mt-6 text-sm leading-6 whitespace-pre-wrap text-slate-700">{quote.proposal}</p> : null}
            {settings.brand.footer && can("branding") ? <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">{settings.brand.footer}</p> : null}
          </Panel>

          <div className="print:hidden">
            {can("aiProposals") ? (
              <Panel className="p-5 sm:p-6">
                <PanelHeader title="Proposal text" description="Written from your line items. Totals never change." icon={Sparkles} aside={<Button type="button" variant="soft" size="lg" className="h-9 rounded-full px-4" onClick={writeProposal}>{quote.proposal ? "Rewrite" : "Write proposal"}</Button>} />
                <TextAreaField aria-label="Proposal text" className="mt-4 min-h-40" value={quote.proposal} onChange={(e) => updateQuote(quote.id, { proposal: e.target.value.slice(0, 4000) })} placeholder="Click “Write proposal” to draft it, then edit." />
              </Panel>
            ) : (
              <UpgradeCard feature="aiProposals" compact />
            )}
          </div>
        </div>

        <div className="space-y-6 print:hidden">
          <Panel className="p-5">
            <PanelHeader title="Share" icon={Link2} />
            {can("shareLink") ? (
              <>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-2 pl-3 text-xs text-slate-600"><span className="min-w-0 flex-1 truncate">{link}</span><Button type="button" variant="ghost" size="icon" aria-label="Copy link" onClick={() => { navigator.clipboard?.writeText(link); notify.success("Link copied"); }}><Copy /></Button></div>
                {quote.revisionNote ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><b>Customer asked:</b> {quote.revisionNote}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {status === "revision" ? <Button type="button" variant="neutral" size="lg" className="h-9 rounded-full px-4" onClick={() => setQuoteStatus(quote.id, "draft")}>Back to draft</Button> : null}
                  {status === "sent" ? <Button type="button" variant="neutral" size="lg" className="h-9 rounded-full px-4" onClick={() => setQuoteStatus(quote.id, "approved")}>Mark approved</Button> : null}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Share links and customer approvals are on the Pro plan. Starter quotes can be exported as PDF.</p>
            )}
          </Panel>

          <Panel className="p-5">
            <PanelHeader title="History" icon={StickyNote} />
            <div className="mt-4 flex gap-2">
              <TextField aria-label="Add a note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Add a note" />
              <Button type="button" variant="soft" size="lg" className="h-11 rounded-full px-4" disabled={!note.trim()} onClick={() => { addQuoteNote(quote.id, note.trim()); setNote(""); }}>Add</Button>
            </div>
            <Stagger as="ol" className="mt-5 space-y-4">
              {events.map((e) => (
                <StaggerItem key={e.id}><p className="text-sm text-ink">{e.body}</p><p className="text-xs text-slate-400">{new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></StaggerItem>
              ))}
            </Stagger>
          </Panel>
        </div>
      </div>
    </div>
  );
}
