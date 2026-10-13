"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { FeatureGate } from "@/components/billing/feature-gate";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField, TextField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useMounted } from "@/hooks/use-mounted";
import { formatInr } from "@/lib/format";
import { notify } from "@/lib/toast";
import { saveSettings, useSettings } from "@/services/settings";

const SWATCHES = ["#e8590c", "#0c8599", "#2f9e44", "#7048e8", "#1c7ed6", "#c2255c", "#0e1116"];

function Form() {
  const saved = useSettings();
  const [draft, setDraft] = useState<{ businessName: string; color: string; footer: string } | null>(null);
  const v = draft ?? { businessName: saved.businessName, color: saved.brand.color, footer: saved.brand.footer };
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify({ businessName: saved.businessName, color: saved.brand.color, footer: saved.brand.footer });

  const save = async () => {
    try {
      await saveSettings({ ...saved, businessName: v.businessName.trim(), brand: { color: v.color, footer: v.footer.trim() } });
      setDraft(null);
      notify.success("Branding saved");
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Branding" description="Shown on every PDF and on the page your customer opens." actions={<Button type="button" variant="brand" size="xl" className="rounded-full px-6" disabled={!dirty} onClick={save}>Save changes</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Your brand" icon={Palette} />
          <div className="mt-5 space-y-4">
            <FormField label="Business name" htmlFor="bn"><TextField id="bn" value={v.businessName} onChange={(e) => setDraft({ ...v, businessName: e.target.value.slice(0, 80) })} placeholder="Sparkle Cleaners" /></FormField>
            <FormField label="Accent colour" htmlFor="color">
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((c) => <button key={c} type="button" aria-label={`Use ${c}`} aria-pressed={v.color === c} onClick={() => setDraft({ ...v, color: c })} className="size-8 rounded-full ring-offset-2 transition active:scale-90 aria-pressed:ring-2 aria-pressed:ring-slate-900" style={{ backgroundColor: c }} />)}
                <TextField id="color" value={v.color} onChange={(e) => setDraft({ ...v, color: e.target.value.slice(0, 7) })} className="w-28" aria-label="Hex colour" />
              </div>
            </FormField>
            <FormField label="Footer" htmlFor="footer" hint="Address, GST number or a thank-you line"><TextAreaField id="footer" value={v.footer} onChange={(e) => setDraft({ ...v, footer: e.target.value.slice(0, 200) })} className="min-h-20" /></FormField>
          </div>
        </Panel>
        <Panel className="p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Preview</p>
          <p className="mt-4 text-xs font-bold tracking-widest uppercase" style={{ color: /^#[0-9a-f]{6}$/i.test(v.color) ? v.color : "#e8590c" }}>{v.businessName || "Your business"}</p>
          <h3 className="mt-1 text-xl font-semibold text-ink">Quote #1042</h3>
          <div className="mt-4 divide-y divide-slate-100 text-sm"><div className="flex justify-between py-2"><span>End of tenancy clean</span><b>{formatInr(4500)}</b></div><div className="flex justify-between py-2"><span>Oven clean</span><b>{formatInr(500)}</b></div></div>
          <div className="mt-2 flex justify-between border-t-2 border-slate-200 pt-3"><b>Total</b><b className="text-lg">{formatInr(5000)}</b></div>
          {v.footer ? <p className="mt-5 text-xs text-slate-400">{v.footer}</p> : null}
        </Panel>
      </div>
    </div>
  );
}

export function BrandingView() {
  const mounted = useMounted();
  if (!mounted) return null;
  return <FeatureGate feature="branding"><Form /></FeatureGate>;
}
