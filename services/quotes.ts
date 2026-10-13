"use client";

import { flash } from "@/lib/flash";
import { createCollection } from "@/lib/collection";
import { DAY_MS } from "@/lib/date";
import { statusMeta } from "@/lib/quotes";
import { createClient } from "@/utils/supabase/client";
import type { Addon, Customer, CustomerInput, Language, LineItem, PublicQuote, Quote, QuoteEvent, QuoteEventType, QuoteInputs, QuoteStatus, Service, ServiceInput } from "@/types/quote";

// Supabase tables: services, addons, customers, quotes, quote_events (supabase/migrations/0003 + 0006).
// Falls back to localStorage demo data when signed out or the tables don't exist yet.

const services = createCollection<Service>({
  table: "services",
  localKey: "services",
  toRow: (s) => ({ id: s.id, name: s.name, base_price: s.basePrice, per_room: s.perRoom, per_bathroom: s.perBathroom, per_sqft: s.perSqft, min_price: s.minPrice, active: s.active }),
  fromRow: (r) => ({ id: String(r.id), name: String(r.name), basePrice: Number(r.base_price ?? 0), perRoom: Number(r.per_room ?? 0), perBathroom: Number(r.per_bathroom ?? 0), perSqft: Number(r.per_sqft ?? 0), minPrice: Number(r.min_price ?? 0), active: r.active !== false }),
});

const addons = createCollection<Addon>({
  table: "addons",
  localKey: "addons",
  toRow: (a) => ({ id: a.id, name: a.name, price: a.price, active: a.active }),
  fromRow: (r) => ({ id: String(r.id), name: String(r.name), price: Number(r.price ?? 0), active: r.active !== false }),
});

const customers = createCollection<Customer>({
  table: "customers",
  localKey: "customers",
  toRow: (c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, address: c.address, created_at: c.createdAt }),
  fromRow: (r) => ({ id: String(r.id), name: String(r.name), phone: String(r.phone ?? ""), email: String(r.email ?? ""), address: String(r.address ?? ""), createdAt: String(r.created_at) }),
});

const quotes = createCollection<Quote>({
  table: "quotes",
  localKey: "quotes",
  toRow: (q) => ({
    id: q.id, number: q.number, customer_id: q.customerId, customer_name: q.customerName, customer_phone: q.customerPhone, customer_email: q.customerEmail, customer_address: q.customerAddress,
    service_id: q.serviceId, service_name: q.serviceName, inputs: q.inputs, line_items: q.lineItems, total: q.total, proposal: q.proposal, language: q.language, status: q.status, token: q.token,
    expires_at: q.expiresAt, revision_note: q.revisionNote, responded_at: q.respondedAt, created_at: q.createdAt, updated_at: q.updatedAt,
  }),
  fromRow: (r) => ({
    id: String(r.id), number: Number(r.number), customerId: r.customer_id ? String(r.customer_id) : null, customerName: String(r.customer_name), customerPhone: String(r.customer_phone ?? ""), customerEmail: String(r.customer_email ?? ""), customerAddress: String(r.customer_address ?? ""),
    serviceId: r.service_id ? String(r.service_id) : null, serviceName: String(r.service_name ?? ""), inputs: r.inputs as QuoteInputs, lineItems: (r.line_items as LineItem[]) ?? [], total: Number(r.total ?? 0), proposal: String(r.proposal ?? ""), language: r.language as Language,
    status: r.status as QuoteStatus, token: String(r.token), expiresAt: r.expires_at ? String(r.expires_at) : null, revisionNote: String(r.revision_note ?? ""), respondedAt: r.responded_at ? String(r.responded_at) : null, createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  }),
});

const events = createCollection<QuoteEvent>({
  table: "quote_events",
  localKey: "quote_events",
  toRow: (e) => ({ id: e.id, quote_id: e.quoteId, type: e.type, body: e.body, at: e.at }),
  fromRow: (r) => ({ id: String(r.id), quoteId: String(r.quote_id), type: r.type as QuoteEventType, body: String(r.body), at: String(r.at) }),
});

const stamp = () => new Date().toISOString();
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, "0")).join("");
export const inDays = (n: number) => new Date(Date.now() + n * DAY_MS).toISOString();
const find = (id: string) => quotes.get().find((q) => q.id === id);

// ---- services & add-ons ----
export function useServices() {
  const { items, loaded } = services.use();
  return { services: items.filter((s) => s.active), loaded };
}
export const addService = (input: ServiceInput) => services.insert([{ ...input, id: crypto.randomUUID(), active: true }]);
export const updateService = (id: string, patch: Partial<ServiceInput>) => services.replace(id, (s) => ({ ...s, ...patch }));
// Archive instead of delete so old quotes keep their service reference.
export const archiveService = (id: string) => services.replace(id, (s) => ({ ...s, active: false }));

export function useAddons() {
  const { items, loaded } = addons.use();
  return { addons: items.filter((a) => a.active), loaded };
}
export const addAddon = (name: string, price: number) => addons.insert([{ id: crypto.randomUUID(), name, price, active: true }]);
export const updateAddon = (id: string, patch: Partial<Pick<Addon, "name" | "price">>) => addons.replace(id, (a) => ({ ...a, ...patch }));
export const archiveAddon = (id: string) => addons.replace(id, (a) => ({ ...a, active: false }));

// ---- customers ----
export function useCustomers() {
  const { items, loaded } = customers.use();
  return { customers: items, loaded };
}
export function addCustomer(input: CustomerInput): Customer {
  const c: Customer = { ...input, id: crypto.randomUUID(), createdAt: stamp() };
  customers.insert([c]);
  flash([c.id]);
  return c;
}
export const updateCustomer = (id: string, patch: Partial<CustomerInput>) => customers.replace(id, (c) => ({ ...c, ...patch }));
export const deleteCustomer = (id: string) => customers.remove([id]);

// ---- quotes ----
export function useQuotes() {
  const { items, loaded } = quotes.use();
  return { quotes: [...items].sort((a, b) => b.number - a.number), loaded };
}
export function useQuote(id: string) {
  const { quotes: all, loaded } = useQuotes();
  return { quote: all.find((q) => q.id === id), loaded };
}
export function useQuoteEvents(quoteId?: string) {
  const { items } = events.use();
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return quoteId ? sorted.filter((e) => e.quoteId === quoteId) : sorted;
}

export function logEvent(quoteId: string, type: QuoteEventType, body: string) {
  events.insert([{ id: crypto.randomUUID(), quoteId, type, body, at: stamp() }]);
}

export interface QuoteDraft {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serviceId: string | null;
  serviceName: string;
  inputs: QuoteInputs;
  lineItems: LineItem[];
  total: number;
  language: Language;
}

export function createQuote(draft: QuoteDraft): Quote {
  const now = stamp();
  const number = Math.max(1000, ...quotes.get().map((q) => q.number)) + 1;
  const quote: Quote = { ...draft, id: crypto.randomUUID(), number, proposal: "", status: "draft", token: newToken(), expiresAt: null, revisionNote: "", respondedAt: null, createdAt: now, updatedAt: now };
  quotes.insert([quote]);
  flash([quote.id]);
  logEvent(quote.id, "created", "Quote created");
  return quote;
}

export function updateQuote(id: string, patch: Partial<Pick<Quote, "proposal" | "language" | "customerName" | "customerPhone" | "customerEmail" | "customerAddress">>) {
  quotes.replace(id, (q) => ({ ...q, ...patch, updatedAt: stamp() }));
}

export function sendQuote(id: string, expiryDays: number) {
  const q = find(id);
  if (!q || q.status === "approved") return;
  quotes.replace(id, (x) => ({ ...x, status: "sent", expiresAt: inDays(expiryDays), revisionNote: "", respondedAt: null, updatedAt: stamp() }));
  flash([id]);
  logEvent(id, "sent", `Quote shared. Valid for ${expiryDays} days`);
}

export function setQuoteStatus(id: string, status: QuoteStatus) {
  const q = find(id);
  if (!q || q.status === status) return;
  quotes.replace(id, (x) => ({ ...x, status, updatedAt: stamp() }));
  flash([id]);
  logEvent(id, status === "draft" ? "edit" : (status as QuoteEventType), `Status changed to ${statusMeta(status).label}`);
}

export function addQuoteNote(id: string, text: string) {
  logEvent(id, "note", text);
}

export function deleteQuote(id: string) {
  quotes.remove([id]);
  events.remove(events.get().filter((e) => e.quoteId === id).map((e) => e.id));
}

// ---- public quote link (customer, no login) ----
export async function fetchPublicQuote(token: string): Promise<PublicQuote | null> {
  const { data, error } = await createClient().rpc("get_public_quote", { p_token: token });
  if (error) throw new Error("Couldn't load this quote. Please try again.");
  return (data as PublicQuote | null) ?? null;
}

export async function respondToQuote(token: string, action: "approve" | "revise", note = ""): Promise<QuoteStatus> {
  const { data, error } = await createClient().rpc("respond_public_quote", { p_token: token, p_action: action, p_note: note });
  if (error) throw new Error(error.message.includes("expired") ? "This quote has expired." : "This quote can no longer be answered.");
  return (data as { status: QuoteStatus }).status;
}

// Starter examples for a brand-new workspace (cleaning business).
export function seedExamples() {
  if (services.get().length === 0) {
    services.insert([
      { id: crypto.randomUUID(), name: "End of tenancy clean", basePrice: 2500, perRoom: 600, perBathroom: 300, perSqft: 0, minPrice: 3500, active: true },
      { id: crypto.randomUUID(), name: "Deep clean", basePrice: 1800, perRoom: 400, perBathroom: 250, perSqft: 0, minPrice: 2500, active: true },
    ]);
  }
  if (addons.get().length === 0) {
    addons.insert([
      { id: crypto.randomUUID(), name: "Oven clean", price: 500, active: true },
      { id: crypto.randomUUID(), name: "Carpet shampoo", price: 800, active: true },
    ]);
  }
}
