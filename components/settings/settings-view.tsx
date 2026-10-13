"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Check, CreditCard, FileText, Lock, UserRound } from "lucide-react";
import { Grid } from "@/components/charts/chart-card";
import { StatCard } from "@/components/charts/stat-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, TextField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useAuthState } from "@/context/AuthContext";
import { useMounted } from "@/hooks/use-mounted";
import { useRole } from "@/hooks/use-role";
import { ALL_FEATURES, FEATURE_LABELS, PLAN_QUOTE_CAP } from "@/lib/plans";
import { usePlan } from "@/lib/plan-store";
import { ROLE_LABELS } from "@/lib/roles";
import { quotesThisMonth } from "@/lib/stats";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/services/quotes";
import { saveSettings, useSettings } from "@/services/settings";
import type { Language, WorkspaceSettings } from "@/types/quote";

export function SettingsView() {
  const mounted = useMounted();
  const saved = useSettings();
  if (!mounted) return null;
  return <SettingsForm key={JSON.stringify(saved)} saved={saved} />;
}

function SettingsForm({ saved }: { saved: WorkspaceSettings }) {
  const { user } = useAuthState();
  const { role } = useRole();
  const planInfo = usePlan();
  const { quotes } = useQuotes();
  const [s, setS] = useState<WorkspaceSettings>(saved);
  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const used = quotesThisMonth(quotes);
  const cap = planInfo.plan ? PLAN_QUOTE_CAP[planInfo.plan] : 0;

  const save = async () => {
    try {
      await saveSettings({ ...s, businessName: s.businessName.trim() });
      notify.success("Settings saved");
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Business details, plan and usage." actions={<>{dirty ? <span className="animate-in fade-in flex items-center gap-2 text-xs font-medium text-slate-500"><span className="dot-ping size-2 rounded-full bg-amber-400" />Unsaved changes</span> : null}<Button type="button" variant="brand" size="xl" className="rounded-full px-6" disabled={!dirty} onClick={save}>Save changes</Button></>} />

      <Grid cols={3}>
        <StatCard icon={FileText} label="Quotes this month" value={cap ? `${used} / ${cap}` : String(used)} sub={cap ? `${Math.round((used / cap) * 100)}% of your limit` : undefined} />
        <StatCard icon={CreditCard} label="Plan" value={planInfo.isAdmin ? "Admin" : planInfo.plan ?? "None"} />
        <StatCard icon={Briefcase} label="Quotes in total" value={String(quotes.length)} />
      </Grid>

      <Panel className="p-5 sm:p-6">
        <PanelHeader title="Business" icon={Briefcase} />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <FormField label="Business name" htmlFor="businessName"><TextField id="businessName" value={s.businessName} onChange={(e) => setS({ ...s, businessName: e.target.value.slice(0, 80) })} placeholder="Sparkle Cleaners" /></FormField>
          <FormField label="Default quote language" htmlFor="language">
            <NativeSelect id="language" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value as Language })}>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </NativeSelect>
          </FormField>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Plan and usage" icon={CreditCard} />
          <ul className="mt-5 space-y-2 text-sm">
            {ALL_FEATURES.map((f) => {
              const on = planInfo.can(f);
              return (
                <li key={f} className={cn("flex items-center gap-2", on ? "text-slate-700" : "text-slate-400")}>
                  {on ? <Check className="text-brand size-4" /> : <Lock className="size-4" />}
                  {FEATURE_LABELS[f]}
                  {!on ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pro</span> : null}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            {planInfo.plan === "Starter" && !planInfo.isAdmin ? <Link href="/choose-plan?plan=Pro" className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-10 rounded-full px-5")}>Upgrade to Pro</Link> : null}
            <Link href="/choose-plan" className={cn(buttonVariants({ variant: "neutral", size: "lg" }), "h-10 rounded-full px-5")}>Change or renew plan</Link>
          </div>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <PanelHeader title="Account" icon={UserRound} />
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Name</dt><dd className="truncate font-semibold text-ink">{user?.fullName || "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="truncate font-semibold text-ink">{user?.email || "—"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-slate-500">Role</dt><dd className="font-semibold text-ink">{ROLE_LABELS[role]}</dd></div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
