import type { Role } from "@/config/auth";
import type { Feature } from "@/lib/plans";
import { BadgeCheck, Calculator, ContactRound, FilePlus2, FileText, House, Palette, Repeat, Settings, ShieldCheck, Tag, Users, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  gap?: boolean;
  /** Platform-admin only (the SaaS owner), not a workspace role. */
  admin?: boolean;
  /** Needs this plan feature; the item shows a "Pro" tag when the plan lacks it. */
  feature?: Feature;
  keywords?: string[];
}

const ALL: Role[] = ["owner", "admin", "staff"];
const EVERYONE: Role[] = ["owner", "admin", "staff", "user"];
const MANAGERS: Role[] = ["owner", "admin"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", roles: ALL, href: "/dashboard", icon: House, keywords: "home overview quotes expiring".split(" ") },
  { label: "Quotes", roles: ALL, href: "/quotes", icon: FileText, keywords: "quotes quotations proposals".split(" ") },
  { label: "New Quote", roles: ALL, href: "/quotes/new", icon: FilePlus2, keywords: "new quote create estimate".split(" ") },
  { label: "Services & Pricing", roles: MANAGERS, href: "/pricing", icon: Calculator, gap: true, keywords: "services pricing rules add-ons travel minimum".split(" ") },
  { label: "Customers", roles: ALL, href: "/customers", icon: ContactRound, keywords: "customers clients contacts".split(" ") },
  { label: "Approvals", feature: "approvals", roles: ALL, href: "/approvals", icon: BadgeCheck, keywords: "approval revision expiry status".split(" ") },
  { label: "Branding", feature: "branding", roles: MANAGERS, href: "/branding", icon: Palette, keywords: "branding logo pdf template".split(" ") },
  { label: "Settings", roles: MANAGERS, href: "/settings", icon: Settings, keywords: "settings workspace usage plan".split(" ") },
  { label: "Overview", roles: EVERYONE, admin: true, href: "/admin", icon: ShieldCheck, keywords: "admin platform overview revenue".split(" ") },
  { label: "Payments", roles: EVERYONE, admin: true, href: "/admin/payments", icon: Wallet, keywords: "payments upi utr verify".split(" ") },
  { label: "Customers", roles: EVERYONE, admin: true, href: "/admin/customers", icon: Users, keywords: "customers users accounts".split(" ") },
  { label: "Subscriptions", roles: EVERYONE, admin: true, href: "/admin/subscriptions", icon: Repeat, keywords: "subscriptions renew expiring".split(" ") },
  { label: "Plans", roles: EVERYONE, admin: true, href: "/admin/plans", icon: Tag, keywords: "plans pricing upi".split(" ") },
];

export type NavArea = "workspace" | "admin";

// The customer workspace and the platform-admin console are separate areas with separate menus.
export const visibleNav = (role: Role, area: NavArea = "workspace") => NAV_ITEMS.filter((i) => (area === "admin" ? i.admin : !i.admin && i.roles.includes(role)));

export const navItemFor = (pathname: string) =>
  NAV_ITEMS.filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
