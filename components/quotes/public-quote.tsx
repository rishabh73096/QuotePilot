"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, MessageSquareWarning } from "lucide-react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { formatInr } from "@/lib/format";
import { notify } from "@/lib/toast";
import { fetchPublicQuote, respondToQuote } from "@/services/quotes";
import type { PublicQuote, QuoteStatus } from "@/types/quote";

const COPY = {
  en: { title: "Your quote", total: "Total", approve: "Approve quote", revise: "Request changes", note: "What should we change?", send: "Send request", approved: "Approved. Thank you!", approvedSub: "We'll be in touch to confirm the date.", revision: "Change request sent", revisionSub: "We'll update the quote and send it again.", expired: "This quote has expired", expiredSub: "Please contact us for a fresh one.", valid: "Valid until" },
  hi: { title: "आपका कोटेशन", total: "कुल", approve: "कोटेशन स्वीकार करें", revise: "बदलाव माँगें", note: "क्या बदलना है?", send: "अनुरोध भेजें", approved: "स्वीकृत। धन्यवाद!", approvedSub: "तारीख़ पक्की करने के लिए हम संपर्क करेंगे।", revision: "बदलाव का अनुरोध भेज दिया", revisionSub: "हम कोटेशन अपडेट करके दोबारा भेजेंगे।", expired: "यह कोटेशन समाप्त हो गया है", expiredSub: "नया कोटेशन पाने के लिए हमसे संपर्क करें।", valid: "मान्य तिथि" },
};

export function PublicQuoteView({ token }: { token: string }) {
  const [quote, setQuote] = useState<PublicQuote | null | undefined>(undefined);
  const [status, setStatus] = useState<QuoteStatus | null>(null);
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPublicQuote(token).then((q) => { setQuote(q); setStatus(q?.status ?? null); }).catch(() => setQuote(null));
  }, [token]);

  if (quote === undefined) return <main className="grid min-h-svh place-items-center"><Loader2 className="text-brand size-6 animate-spin" /></main>;
  if (!quote || !status) return <main className="grid min-h-svh place-items-center px-6 text-center"><div><h1 className="text-xl font-bold text-ink">Quote not found</h1><p className="mt-2 text-sm text-slate-500">This link may be wrong or the quote was withdrawn.</p></div></main>;

  const t = COPY[quote.language] ?? COPY.en;
  const color = quote.business.color || "#e8590c";
  const respond = async (action: "approve" | "revise") => {
    setBusy(true);
    try {
      setStatus(await respondToQuote(token, action, note));
    } catch (e) {
      notify.error(e);
    } finally {
      setBusy(false);
    }
  };

  const done = status === "approved" ? { icon: CheckCircle2, title: t.approved, sub: t.approvedSub } : status === "revision" ? { icon: MessageSquareWarning, title: t.revision, sub: t.revisionSub } : status === "expired" ? { icon: Clock, title: t.expired, sub: t.expiredSub } : null;

  return (
    <main className="min-h-svh bg-[#faf8f5] px-4 py-10">
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,17,41,0.25)] sm:p-9">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color }}>{quote.business.name || "Quotation"}</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">{t.title} #{quote.number}</h1>
        <p className="mt-1 text-sm text-slate-500">{quote.customerName} · {quote.serviceName}</p>

        <ul className="mt-6 divide-y divide-slate-100 text-sm">
          {quote.lineItems.map((l, i) => (
            <li key={i} className="flex justify-between gap-3 py-2.5"><span><span className="font-medium text-ink">{l.label}</span><span className="block text-xs text-slate-500">{l.detail}</span></span><span className="font-semibold text-ink">{l.amount < 0 ? "−" : ""}{formatInr(Math.abs(l.amount))}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex items-end justify-between border-t-2 border-slate-200 pt-4"><span className="text-base font-bold text-ink">{t.total}</span><span className="text-3xl font-semibold text-ink">{formatInr(quote.total)}</span></div>
        {quote.expiresAt ? <p className="mt-1 text-right text-xs text-slate-400">{t.valid} {new Date(quote.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p> : null}
        {quote.proposal ? <p className="mt-6 text-sm leading-6 whitespace-pre-wrap text-slate-700">{quote.proposal}</p> : null}

        <div className="mt-8">
          {done ? (
            <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-slate-50 p-6 text-center"><done.icon className="mx-auto size-8" style={{ color }} /><p className="mt-3 text-lg font-bold text-ink">{done.title}</p><p className="mt-1 text-sm text-slate-500">{done.sub}</p></m.div>
          ) : asking ? (
            <div className="space-y-3">
              <TextAreaField aria-label={t.note} placeholder={t.note} value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} className="min-h-28" />
              <div className="flex gap-3"><Button type="button" variant="neutral" size="xl" className="flex-1 rounded-full" onClick={() => setAsking(false)}>←</Button><Button type="button" variant="brand" size="xl" className="flex-[3] rounded-full" loading={busy} disabled={!note.trim()} onClick={() => respond("revise")}>{t.send}</Button></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" variant="brand" size="xl" className="flex-1 rounded-full" loading={busy} style={{ backgroundColor: color }} onClick={() => respond("approve")}>{t.approve}</Button><Button type="button" variant="neutral" size="xl" className="flex-1 rounded-full" onClick={() => setAsking(true)}>{t.revise}</Button></div>
          )}
        </div>
        {quote.business.footer ? <p className="mt-6 text-center text-xs text-slate-400">{quote.business.footer}</p> : null}
      </m.div>
    </main>
  );
}
