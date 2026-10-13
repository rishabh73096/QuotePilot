import type { Language, LineItem } from "@/types/quote";

interface Input {
  customerName: string;
  serviceName: string;
  lineItems: LineItem[];
  total: number;
  businessName: string;
  language: Language;
  expiryDays: number;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// Template-based proposal text. Swap for an LLM call later: it must only ever reword this text,
// never change the line items or the total (pricing comes from lib/pricing.ts).
export function draftProposal(i: Input): string {
  const lines = i.lineItems.map((l) => `• ${l.label}${l.detail ? ` (${l.detail})` : ""}: ${inr(l.amount)}`).join("\n");
  const who = i.businessName || "our team";
  if (i.language === "hi") {
    return `नमस्ते ${i.customerName},\n\n${who} की ओर से आपके ${i.serviceName} के लिए यह कोटेशन है।\n\nशामिल:\n${lines}\n\nकुल: ${inr(i.total)}\n\nयह कोटेशन ${i.expiryDays} दिन तक मान्य है। स्वीकृत करने के लिए लिंक खोलें, या बदलाव चाहिए तो हमें बताएँ।\n\nधन्यवाद,\n${who}`;
  }
  return `Hi ${i.customerName},\n\nThank you for asking ${who} for a quote on ${i.serviceName}.\n\nWhat's included:\n${lines}\n\nTotal: ${inr(i.total)}\n\nThis quote is valid for ${i.expiryDays} days. Open the link to approve it, or tell us what you'd like changed and we'll update it.\n\nThanks,\n${who}`;
}
