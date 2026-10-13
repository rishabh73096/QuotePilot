import type { Addon, LineItem, PricingRules, QuoteInputs, Service } from "@/types/quote";

export interface PriceResult {
  lineItems: LineItem[];
  total: number;
}

// The only place a quote total is computed. Owner-set rules in, whole rupees out; AI never touches numbers.
// Order: base + per-unit charges, raised to the minimum job price, + add-ons, + travel, - discount, + tax.
export function calculateQuote(service: Service | undefined, inputs: QuoteInputs, addons: Addon[], rules: PricingRules): PriceResult {
  if (!service) return { lineItems: [], total: 0 };
  const items: LineItem[] = [];
  const push = (label: string, detail: string, amount: number) => {
    const rounded = Math.round(amount);
    if (rounded !== 0) items.push({ label, detail, amount: rounded });
  };

  push("Base clean", service.name, service.basePrice);
  push("Rooms", `${inputs.rooms} × ₹${service.perRoom}`, inputs.rooms * service.perRoom);
  push("Bathrooms", `${inputs.bathrooms} × ₹${service.perBathroom}`, inputs.bathrooms * service.perBathroom);
  push("Area", `${inputs.area} sq ft × ₹${service.perSqft}`, inputs.area * service.perSqft);

  const serviceSubtotal = items.reduce((n, i) => n + i.amount, 0);
  if (serviceSubtotal < service.minPrice) push("Minimum job price", `Raised to ₹${service.minPrice}`, service.minPrice - serviceSubtotal);

  inputs.addonIds
    .map((id) => addons.find((a) => a.id === id))
    .filter((a): a is Addon => Boolean(a))
    .forEach((a) => push(a.name, "Add-on", a.price));

  push("Travel", "Travel charge", rules.travelCharge);

  const beforeDiscount = items.reduce((n, i) => n + i.amount, 0);
  if (rules.discountPercent > 0) push("Discount", `${rules.discountPercent}% off`, -(beforeDiscount * rules.discountPercent) / 100);

  const taxable = items.reduce((n, i) => n + i.amount, 0);
  if (rules.taxPercent > 0) push("Tax", `${rules.taxPercent}%`, (taxable * rules.taxPercent) / 100);

  return { lineItems: items, total: items.reduce((n, i) => n + i.amount, 0) };
}
