"use client";

import { useEffect, useSyncExternalStore } from "react";
import { currentUserId, registerReset } from "@/lib/collection";
import { registerLocalKey } from "@/lib/local-store";
import { createClient } from "@/utils/supabase/client";
import type { WorkspaceSettings } from "@/types/quote";

// Supabase table `workspace_settings` (one row per user, JSON `data`): pricing rules, language, branding.
// Falls back to localStorage when signed out or the table is missing.
export const DEFAULT_SETTINGS: WorkspaceSettings = {
  businessName: "",
  language: "en",
  rules: { travelCharge: 0, discountPercent: 0, taxPercent: 0, expiryDays: 7 },
  brand: { color: "#e8590c", footer: "" },
};

const merge = (raw: Partial<WorkspaceSettings> | null | undefined): WorkspaceSettings => ({
  ...DEFAULT_SETTINGS,
  ...raw,
  rules: { ...DEFAULT_SETTINGS.rules, ...(raw?.rules ?? {}) },
  brand: { ...DEFAULT_SETTINGS.brand, ...(raw?.brand ?? {}) },
});

const KEY = "settings";
registerLocalKey(KEY);

let value: WorkspaceSettings = DEFAULT_SETTINGS;
let remote = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load() {
  const userId = await currentUserId();
  if (userId) {
    const { data, error } = await createClient().from("workspace_settings").select("data").maybeSingle();
    if (!error) {
      remote = true;
      value = merge(data?.data as Partial<WorkspaceSettings>);
      try {
        registerLocalKey(`${KEY}:snapshot:${userId}`);
        window.localStorage.setItem(`${KEY}:snapshot:${userId}`, JSON.stringify(value));
      } catch {}
      return emit();
    }
    console.warn("[workspace_settings] Supabase unavailable:", error.message);
    try {
      const raw = window.localStorage.getItem(`${KEY}:snapshot:${userId}`);
      if (raw || !navigator.onLine) {
        remote = false;
        value = raw ? merge(JSON.parse(raw)) : DEFAULT_SETTINGS;
        return emit();
      }
    } catch {}
  }
  remote = false;
  try {
    const raw = window.localStorage.getItem(KEY);
    value = raw ? merge(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    value = DEFAULT_SETTINGS;
  }
  emit();
}

registerReset(() => {
  loading = null;
  value = DEFAULT_SETTINGS;
  emit();
  if (listeners.size) loading = load();
});

export function useSettings(): WorkspaceSettings {
  const v = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => value,
    () => DEFAULT_SETTINGS,
  );
  useEffect(() => {
    loading ??= load();
  }, []);
  return v;
}

export async function saveSettings(next: WorkspaceSettings) {
  value = next;
  emit();
  if (!remote) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    return;
  }
  const { error } = await createClient().from("workspace_settings").upsert({ data: next, updated_at: new Date().toISOString() });
  if (error) throw new Error("Couldn't save settings. Please try again.");
}
