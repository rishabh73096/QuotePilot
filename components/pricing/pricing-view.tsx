"use client";

import { useState } from "react";
import { Calculator, Percent, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, TextField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useMounted } from "@/hooks/use-mounted";
import { formatInr } from "@/lib/format";
import { notify } from "@/lib/toast";
import { addAddon, addService, archiveAddon, archiveService, seedExamples, updateAddon, updateService, useAddons, useServices } from "@/services/quotes";
import { saveSettings, useSettings } from "@/services/settings";
import type { PricingRules, Service } from "@/types/quote";

const digits = (v: string, max = 9) => Math.min(Number(v.replace(/[^\d.]/g, "")) || 0, 10 ** max);

function Num({ label, value, onChange, prefix = "₹", id }: { label: string; value: number; onChange: (n: number) => void; prefix?: string; id: string }) {
  return (
    <FormField label={label} htmlFor={id}>
      <TextField id={id} inputMode="decimal" value={value ? String(value) : ""} placeholder="0" onChange={(e) => onChange(digits(e.target.value))} aria-label={`${label} (${prefix})`} />
    </FormField>
  );
}

function ServiceCard({ s }: { s: Service }) {
  return (
    <li className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-slate-100 p-4 duration-300">
      <div className="flex items-center gap-3">
        <TextField aria-label="Service name" value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value.slice(0, 80) })} />
        <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Remove ${s.name}`} onClick={() => { archiveService(s.id); notify.success("Service removed"); }}><Trash2 /></Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Num id={`b-${s.id}`} label="Base price" value={s.basePrice} onChange={(n) => updateService(s.id, { basePrice: n })} />
        <Num id={`r-${s.id}`} label="Per room" value={s.perRoom} onChange={(n) => updateService(s.id, { perRoom: n })} />
        <Num id={`t-${s.id}`} label="Per bathroom" value={s.perBathroom} onChange={(n) => updateService(s.id, { perBathroom: n })} />
        <Num id={`a-${s.id}`} label="Per sq ft" value={s.perSqft} onChange={(n) => updateService(s.id, { perSqft: n })} />
        <Num id={`m-${s.id}`} label="Minimum price" value={s.minPrice} onChange={(n) => updateService(s.id, { minPrice: n })} />
      </div>
    </li>
  );
}

export function PricingView() {
  const mounted = useMounted();
  const saved = useSettings();
  const { services, loaded } = useServices();
  const { addons } = useAddons();
  const [rules, setRules] = useState<PricingRules | null>(null);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const current = rules ?? saved.rules;
  const dirty = rules !== null && JSON.stringify(rules) !== JSON.stringify(saved.rules);

  const saveRules = async () => {
    try {
      await saveSettings({ ...saved, rules: current });
      setRules(null);
      notify.success("Rules saved");
    } catch (e) {
      notify.error(e);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Services & pricing" description="Every quote total is calculated from these rules. AI never sets a price." />

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Services" description="Price = base + rooms + bathrooms + area, never below the minimum." icon={Calculator} aside={<Button type="button" variant="soft" size="lg" className="h-9 rounded-full px-4" onClick={() => addService({ name: "New service", basePrice: 0, perRoom: 0, perBathroom: 0, perSqft: 0, minPrice: 0 })}><Plus />Add</Button>} />
        <ul className="mt-5 space-y-3">{services.map((s) => <ServiceCard key={s.id} s={s} />)}</ul>
        {loaded && services.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500">No services yet.</p>
            <Button type="button" variant="soft" size="lg" className="mt-3 rounded-full px-5" onClick={() => { seedExamples(); notify.success("Examples added. Edit them to match your prices."); }}><Sparkles />Start with examples</Button>
          </div>
        ) : null}
      </Panel>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Add-ons" description="Extras a customer can tick, like oven or carpet." icon={Plus} />
        <ul className="mt-5 space-y-3">
          {addons.map((a) => (
            <li key={a.id} className="animate-in fade-in grid grid-cols-[1fr_120px_auto] gap-3 duration-300">
              <TextField aria-label="Add-on name" value={a.name} onChange={(e) => updateAddon(a.id, { name: e.target.value.slice(0, 80) })} />
              <TextField aria-label="Add-on price" inputMode="numeric" value={a.price ? String(a.price) : ""} placeholder="₹" onChange={(e) => updateAddon(a.id, { price: digits(e.target.value) })} />
              <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={`Remove ${a.name}`} onClick={() => archiveAddon(a.id)}><Trash2 /></Button>
            </li>
          ))}
        </ul>
        <form className="mt-4 grid grid-cols-[1fr_120px_auto] gap-3" onSubmit={(e) => { e.preventDefault(); if (!addonName.trim()) return; addAddon(addonName.trim(), digits(addonPrice)); setAddonName(""); setAddonPrice(""); }}>
          <TextField aria-label="New add-on" value={addonName} onChange={(e) => setAddonName(e.target.value.slice(0, 80))} placeholder="New add-on, e.g. Fridge clean" />
          <TextField aria-label="New add-on price" inputMode="numeric" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} placeholder="₹" />
          <Button type="submit" variant="soft" size="lg" className="h-11 rounded-full px-5" disabled={!addonName.trim()}>Add</Button>
        </form>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Rules for every quote" description={`Travel ${formatInr(current.travelCharge)}, discount ${current.discountPercent}%, tax ${current.taxPercent}%.`} icon={Percent} aside={<Button type="button" variant="brand" size="lg" className="h-9 rounded-full px-5" disabled={!dirty} onClick={saveRules}>Save rules</Button>} />
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Num id="travel" label="Travel charge" value={current.travelCharge} onChange={(n) => setRules({ ...current, travelCharge: n })} />
          <Num id="discount" label="Discount %" prefix="%" value={current.discountPercent} onChange={(n) => setRules({ ...current, discountPercent: Math.min(n, 100) })} />
          <Num id="tax" label="Tax %" prefix="%" value={current.taxPercent} onChange={(n) => setRules({ ...current, taxPercent: Math.min(n, 100) })} />
          <Num id="expiry" label="Quote valid (days)" prefix="days" value={current.expiryDays} onChange={(n) => setRules({ ...current, expiryDays: Math.max(1, Math.min(n, 90)) })} />
        </div>
      </Panel>
    </div>
  );
}
