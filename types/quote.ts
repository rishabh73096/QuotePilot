export type QuoteStatus = "draft" | "sent" | "approved" | "revision" | "expired";
export type Language = "en" | "hi";

export interface Service {
  id: string;
  name: string;
  basePrice: number;
  perRoom: number;
  perBathroom: number;
  perSqft: number;
  minPrice: number;
  active: boolean;
}

export type ServiceInput = Omit<Service, "id" | "active">;

export interface Addon {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export type CustomerInput = Pick<Customer, "name" | "phone" | "email" | "address">;

export interface LineItem {
  label: string;
  detail: string;
  amount: number;
}

export interface QuoteInputs {
  rooms: number;
  bathrooms: number;
  area: number;
  addonIds: string[];
}

export interface Quote {
  id: string;
  number: number;
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
  proposal: string;
  language: Language;
  status: QuoteStatus;
  token: string;
  expiresAt: string | null;
  revisionNote: string;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QuoteEventType = "created" | "edit" | "sent" | "approved" | "revision" | "expired" | "note";

export interface QuoteEvent {
  id: string;
  quoteId: string;
  type: QuoteEventType;
  body: string;
  at: string;
}

export interface PricingRules {
  travelCharge: number;
  discountPercent: number;
  taxPercent: number;
  expiryDays: number;
}

export interface WorkspaceSettings {
  businessName: string;
  language: Language;
  rules: PricingRules;
  brand: { color: string; footer: string };
}

export interface PublicQuote {
  number: number;
  customerName: string;
  serviceName: string;
  lineItems: LineItem[];
  total: number;
  proposal: string;
  language: Language;
  status: QuoteStatus;
  expiresAt: string | null;
  business: { name: string; color: string; footer: string };
}
