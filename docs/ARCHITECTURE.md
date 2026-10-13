# QuotePilot AI: Architecture, Flow and Status

Quotation and proposal generator for cleaning businesses. Prices come from owner-defined rules; AI only writes proposal text. See [../../MAIN-DOCUMENT.md](../../MAIN-DOCUMENT.md).

## 1. Architecture

```
Browser (Next.js 16, React 19, Tailwind 4)
  app/(auth)/*        login · signup · forgot-password
  app/(dashboard)/*   dashboard · quotes · pricing · customers · approvals · branding · settings
  public quote page   /q/[token]   (customer view: approve / request revision, no login)
        │  Api() axios client
        ▼
Backend REST API (pending)           ◄──►  MCP server (pending)
  auth · workspaces · services · price rules · quotes · PDF
        │
        ├── MongoDB (workspaceId on every doc)
        ├── PDF renderer (HTML → PDF)
        └── LLM API (proposal text only; capped)
```

Rule: **a deterministic pricing engine computes totals; the LLM never touches numbers.**

## 2. Data model

| Collection | Key fields |
|---|---|
| workspaces | name, branding{logo,color,footer}, currency, language, plan, quoteCount |
| services | workspaceId, name (e.g. end-of-tenancy), basePrice, perRoom, perBathroom, perSqft, minPrice |
| addons | workspaceId, name (oven, carpet), price |
| rules | workspaceId, travelCharge, discounts[], taxPercent, expiryDays |
| quotes | workspaceId, customer{name,phone,email,address}, inputs{rooms,bathrooms,area,serviceId,addonIds}, lineItems[], total, proposalText, language, status (draft/sent/approved/revision/expired), token, expiresAt, history[] |

## 3. Core flows

**Quote**
1. Owner picks service, enters property size, rooms, extras (or customer submits an enquiry form).
2. Pricing engine: base + per-unit + add-ons + travel − discount, floored at minimum price → line items and total. Owner can adjust.
3. "Write proposal" → LLM drafts inclusions/exclusions text from the line items (EN/HI), editable.
4. Generate branded PDF and share link `/q/[token]`.
5. Customer approves or requests revision; status and history update; owner notified.
6. Cron marks unanswered quotes `expired` at `expiresAt`.

**Auth:** same as other products (signup creates workspace, token session, OTP reset).

## 4. Routes

| Route | Purpose | Status |
|---|---|---|
| /login /signup /forgot-password | Auth | Done |
| / | Public landing page | Done |
| /choose-plan | Plan selection after signup | Prototype |
| /dashboard | Dashboard placeholder (quotes by status, expiring soon) | Prototype placeholder |
| /quotes, /quotes/new, /quotes/[id] | List, create form with live price, detail | Pending |
| /pricing | Services, add-ons, rules | Pending |
| /customers | Contacts | Pending |
| /approvals | Approval/revision/expiry tracking | Pending |
| /branding | Logo, colors, PDF template | Pending |
| /settings | Plan, usage, language | Pending |
| /q/[token] | Public customer quote view | Pending |

## 5. API (pending)

`/auth/*` (existing contract) · `CRUD /services /addons`, `PUT /rules` · `POST /quotes/price` (dry-run calc) · `POST /quotes`, `PATCH /quotes/:id` · `POST /quotes/:id/proposal` (LLM) · `GET /quotes/:id/pdf` · public `GET /public/quotes/:token`, `POST /public/quotes/:token/respond`.

## 6. MCP build (prototype)

| Tool | Input | Output |
|---|---|---|
| list_services | none | services, add-ons, rules |
| upsert_service | fields | service |
| calculate_quote | serviceId, rooms, bathrooms, area, addonIds | line items, total (no save) |
| create_quote | customer, inputs | quote draft |
| draft_proposal | quoteId, language | proposal text |
| send_quote | quoteId | share link (no email sent) |
| list_quotes | status? | quotes[] |
| get_expiring_quotes | days | quotes[] |

Resources: `pricing://rules`, `quote://{id}`. Guardrail: `calculate_quote` is the only source of totals; `create_quote` rejects client-supplied totals unless flagged as manual override.

## 7. Prototype scope (build order)

1. Backend skeleton + auth + workspace
2. Services, add-ons, rules + pricing engine with unit tests
3. Quote form with live total
4. Proposal drafting + PDF + share link
5. Public approve/revise page
6. Status and expiry dashboard; MCP server on same service layer

## 8. Feature status

| Feature | Status | Where |
|---|---|---|
| Auth UI: login, signup, forgot password (OTP, 4-digit, 5 min expiry) | Done | `components/auth/`, `app/(auth)/` |
| Session: token store, `AuthProvider`, `useAuthState`, 401 handling | Done | `context/AuthContext.tsx`, `lib/api.ts` |
| Role hook + role-filtered navigation (owner / admin / staff) | Done | `hooks/use-role.ts`, `config/navigation.ts` |
| Dashboard shell: topbar, sidebar, page search (Ctrl/Cmd+K), access-denied | Done | `components/dashboard/` |
| UI kit (forms, tables, modals, tabs, toasts, skeletons, pagination, etc.) | Done | `components/ui/` |
| Zod form schemas + `useForm` hook | Done | `lib/schemas.ts`, `hooks/use-form.ts` |
| Security headers / CSP, open-redirect-safe `next` param | Done | `next.config.ts`, `lib/safe-next.ts` |
| Type-check and production build pass | Done | verified |
| Landing page: hero, flow demo, feature grid, scenarios, pricing, FAQ, CTA | Done | `app/page.tsx`, `components/landing/`, `config/landing.ts` |
| Purchase flow: pricing → signup → choose plan → dashboard (plan gate) | Prototype | `app/choose-plan/`, `lib/subscription.ts`; plan stored in browser, no real payment |
| Per-product auth text, SVG art, accent color, logo mark | Done | `data/auth.ts`, `public/images/auth/`, `app/globals.css` |
| Backend API (auth + data), MongoDB, tenant scoping | Pending | none in repo |
| Replace auth hero text/imagery and logo mark with real brand | Pending | `data/auth.ts`, `public/images/` |
| Billing (Razorpay/Stripe), plan limits, usage caps | Pending | |
| Real billing webhook to activate plan (replaces browser-stored plan) | Pending | |
| MVP 1: Configurable services and pricing rules | Pending | |
| MVP 2: Quotation form with add-ons | Pending | |
| MVP 3: AI-assisted proposal description | Pending | |
| MVP 4: Branded PDF and shareable link | Pending | |
| MVP 5: Customer approval or revision request | Pending | |
| MVP 6: Status and expiry dashboard | Pending | |
| MCP server | Pending | |
| Onboarding help for price setup | Pending | manual service at first |
| Scheduling, routing, payroll, inventory | Out of scope | month one |
