"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField, TextField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { PhoneInput } from "@/components/ui/phone-input";
import { Segmented } from "@/components/ui/segmented";
import { useMounted } from "@/hooks/use-mounted";
import { formatInr } from "@/lib/format";
import { calculateQuote } from "@/lib/pricing";
import { isIndianMobile } from "@/lib/phone";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { createQuote, seedExamples, useAddons, useCustomers, useServices } from "@/services/quotes";
import { useSettings } from "@/services/settings";
import type { Language } from "@/types/quote";
import Link from "next/link";

const num = (v: string) => Math.max(0, Math.min(99999, Number(v.replace(/\D/g, "")) || 0));

export function QuoteBuilder() {
  const mounted = useMounted();
  const router = useRouter();
  const settings = useSettings();
  const { services, loaded } = useServices();
  const { addons } = useAddons();
  const { customers } = useCustomers();

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [rooms, setRooms] = useState("2");
  const [baths, setBaths] = useState("1");
  const [area, setArea] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language | "">("");
  const [error, setError] = useState<string | null>(null);

  const service = services.find((s) => s.id === (serviceId || services[0]?.id));
  const lang = language || settings.language;
  const inputs = useMemo(() => ({ rooms: num(rooms), bathrooms: num(baths), area: num(area), addonIds: picked }), [rooms, baths, area, picked]);
  const price = useMemo(() => calculateQuote(service, inputs, addons, settings.rules), [service, inputs, addons, settings.rules]);

  const pickCustomer = (id: string) => {
    setCustomerId(id);
    const c = customers.find((x) => x.id === id);
    if (c) { setName(c.name); setPhone(c.phone); setEmail(c.email); setAddress(c.address); }
  };

  const save = () => {
    if (name.trim().length < 2) return setError("Enter the customer's name");
    if (phone && !isIndianMobile(phone)) return setError("Enter a valid 10-digit Indian mobile number");
    if (!service) return setError("Add a service first");
    setError(null);
    const quote = createQuote({
      customerId: customerId || null, customerName: name.trim(), customerPhone: phone, customerEmail: email.trim(), customerAddress: address.trim(),
      serviceId: service.id, serviceName: service.name, inputs, lineItems: price.lineItems, total: price.total, language: lang,
    });
    notify.success(`Quote #${quote.number} created`);
    router.push(`/quotes/${quote.id}`);
  };

  if (!mounted) return null;

  if (loaded && services.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="New quote" />
        <Panel className="mx-auto max-w-xl p-8 text-center">
          <span className="bg-brand/10 text-brand mx-auto flex size-14 items-center justify-center rounded-2xl"><Calculator className="size-6" /></span>
          <h2 className="mt-4 text-xl font-bold text-ink">Set your prices first</h2>
          <p className="mt-2 text-sm text-slate-500">Quotes are calculated from your services and rules. Add yours, or start with two examples and edit them.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button type="button" variant="brand" size="xl" className="rounded-full px-6" onClick={() => { seedExamples(); notify.success("Example services added"); }}>Use examples</Button>
            <Link href="/pricing" className="inline-flex h-11 items-center rounded-full bg-slate-100 px-6 text-sm font-semibold text-ink hover:bg-slate-200">Add my services</Link>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New quote" description="The total updates as you type. It always comes from your pricing rules." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <PanelHeader title="Customer" icon={UserRound} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {customers.length ? (
                <FormField label="Saved customer" htmlFor="saved" className="sm:col-span-2">
                  <NativeSelect id="saved" value={customerId} onChange={(e) => pickCustomer(e.target.value)}>
                    <option value="">New customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </NativeSelect>
                </FormField>
              ) : null}
              <FormField label="Name" htmlFor="cname"><TextField id="cname" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} placeholder="Meera Kapoor" /></FormField>
              <FormField label="Phone" htmlFor="cphone"><PhoneInput id="cphone" name="cphone" value={phone} onChange={setPhone} /></FormField>
              <FormField label="Email" htmlFor="cemail"><TextField id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" /></FormField>
              <FormField label="Property address" htmlFor="caddr"><TextField id="caddr" value={address} onChange={(e) => setAddress(e.target.value.slice(0, 300))} placeholder="optional" /></FormField>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <PanelHeader title="Job details" icon={Calculator} />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Service" htmlFor="svc" className="sm:col-span-2">
                <NativeSelect id="svc" value={service?.id ?? ""} onChange={(e) => setServiceId(e.target.value)}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </NativeSelect>
              </FormField>
              <FormField label="Rooms" htmlFor="rooms"><TextField id="rooms" inputMode="numeric" value={rooms} onChange={(e) => setRooms(e.target.value)} /></FormField>
              <FormField label="Bathrooms" htmlFor="baths"><TextField id="baths" inputMode="numeric" value={baths} onChange={(e) => setBaths(e.target.value)} /></FormField>
              <FormField label="Area (sq ft)" htmlFor="area" hint="Only charged if the service has a per-sq-ft rate"><TextField id="area" inputMode="numeric" value={area} onChange={(e) => setArea(e.target.value)} placeholder="optional" /></FormField>
              <FormField label="Language" htmlFor="lang">
                <Segmented label="Quote language" value={lang} onChange={(v) => setLanguage(v)} options={[{ value: "en", label: "English" }, { value: "hi", label: "हिन्दी" }]} />
              </FormField>
              {addons.length ? (
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-[13px] font-semibold text-ink">Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {addons.map((a) => {
                      const on = picked.includes(a.id);
                      return (
                        <button key={a.id} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : [...p, a.id]))} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition active:scale-95", on ? "border-brand bg-brand/10 text-brand" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                          {a.name} · {formatInr(a.price)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <Panel className="h-fit p-5 sm:p-6 lg:sticky lg:top-[90px]">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Live total</p>
          <p className="font-inter mt-1 text-4xl font-semibold tracking-[-0.03em] text-ink">{formatInr(price.total)}</p>
          <ul className="mt-5 divide-y divide-slate-100 text-sm">
            {price.lineItems.map((l, i) => (
              <li key={`${l.label}-${i}`} className="animate-in fade-in flex items-start justify-between gap-3 py-2.5 duration-200">
                <span><span className="font-medium text-ink">{l.label}</span><span className="block text-xs text-slate-500">{l.detail}</span></span>
                <span className={cn("shrink-0 font-semibold", l.amount < 0 ? "text-emerald-600" : "text-ink")}>{l.amount < 0 ? "−" : ""}{formatInr(Math.abs(l.amount))}</span>
              </li>
            ))}
            {price.lineItems.length === 0 ? <li className="py-3 text-slate-400">Pick a service to see the price.</li> : null}
          </ul>
          {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
          <Button type="button" variant="brand" size="xl" className="mt-5 w-full rounded-full" onClick={save} disabled={!service}>Create quote</Button>
          <p className="mt-3 text-center text-xs text-slate-400">Rules: travel {formatInr(settings.rules.travelCharge)}, discount {settings.rules.discountPercent}%, tax {settings.rules.taxPercent}%.</p>
        </Panel>
      </div>
    </div>
  );
}
