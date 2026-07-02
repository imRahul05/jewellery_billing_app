# Jewellery ERP — Base Setup Design

> **Date:** 2026-07-01 · **Status:** Approved
> **Sources:** `jewellery-saas-docs/docs/03-Database-Design.md`, `04-Authentication-Security.md`, `07-Frontend-Specification.md`
> **Target repo:** `jewellery-erp` (Next.js 16 App Router + TypeScript, Tailwind v4, shadcn, Neon).

## 1. Goal

Stand up the working foundation for the Jewellery ERP SaaS:

- Full Prisma schema (26 tables) from doc 03.
- Neon Auth integration (doc 04) — code complete; keys provisioned later by user.
- Design system + login/signup + tenant-aware dashboard shell (doc 07).

End state: `pnpm build` compiles; migration + seed ready to run once Neon Auth keys land in `.env`.

## 2. Decisions

| Decision | Choice | Source |
| --- | --- | --- |
| Schema scope | Full 26 tables now | user |
| ORM | Prisma + Prisma Migrate | doc 03 |
| Money type | `Decimal(14,2)` — rupees.paise, e.g. `121.12` | doc 03 §4 + user |
| Weight | `Decimal(12,3)` grams | doc 03 §4 |
| Rates | `Decimal(14,4)` | doc 03 §4 |
| Auth | Neon Auth (`@stackframe/stack`) | doc 04 §5 |
| Provisioning | Code built now, Neon Auth keys added by user later | user |
| Tenancy | shared DB / shared schema, `tenant_id` on every business table | doc 03 §13 |
| Server state | TanStack React Query (`@tanstack/react-query`) | doc 07 + user |
| Client/UI state | Zustand | user |

**State split:** clean separation of concerns.

- **Server state** → TanStack Query. Anything from the DB/API (invoices, inventory, customers). Handles caching, refetch, invalidation, loading/error. Initial RSC data hydrated into Query cache where useful.
- **Client/UI state** → Zustand. Ephemeral UI only, never server data: sidebar collapsed, active tenant selection (mirror of session), theme-independent UI toggles, in-progress bill draft in the POS screen, modal/dialog open state.
- **Rule:** never duplicate server data into Zustand. Query owns server truth; Zustand owns UI truth.

**Money formatting:** all money stored as `Decimal(14,2)`. `lib/format.ts` `formatINR` takes a rupee value (not paise) and renders Indian grouping with 2 decimals — `₹1,21,212.12`. Overrides doc 07's paise-integer note per user.

## 3. Build sequence

Delivered in reviewable stages, same end state.

### (a) Dependencies, design tokens, format utils

- Install: `prisma`, `@prisma/client`, `@stackframe/stack`, `@neondatabase/serverless`, `next-themes`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `zustand`.
- Add shadcn primitives: `input`, `label`, `card`, `form`, `sonner`, `dropdown-menu`, `avatar`, `separator`, `sidebar`, `skeleton`.
- `app/globals.css` — replace greyscale tokens with doc 07 §4.2 semantic palette: deep-gold `--primary`, plus `--success` / `--warning` / `--destructive`, light + dark. Keep oklch form already in file.
- `app/layout.tsx` — Inter variable font w/ tabular numerals (replace Geist); `next-themes` provider; metadata → "Jewellery ERP".
- `lib/format.ts` — `formatINR`, `formatIndianNumber`, `formatWeight`, `formatINRWords` (rupee-based, 2 dp).

**Providers & state wiring**

- `components/providers.tsx` (Client) — composes `<QueryClientProvider>` (+ Devtools in dev) inside `next-themes` + `<StackProvider>`. Mounted once in `app/layout.tsx`.
- `lib/query/client.ts` — `getQueryClient()` (server: fresh per request; browser: singleton) with sane defaults (`staleTime`, retry, refetch-on-focus off for POS).
- `lib/query/keys.ts` — typed query-key factory (`qk.invoices.list(tenantId)`, `qk.inventory.item(id)` …) so invalidation is centralized, not stringly-typed.
- `lib/stores/` — Zustand stores, one file per domain of UI state:
  - `ui-store.ts` — sidebar collapsed, command-palette open, global dialogs.
  - `tenant-store.ts` — active tenant id/name mirror for client components (source of truth stays server session).
  - `bill-draft-store.ts` — in-progress POS bill lines (stub now; billing engine later).
- **Convention:** hooks live in `lib/query/hooks/*` (e.g. `use-invoices.ts` wrapping `useQuery`/`useMutation`); components consume hooks, never call fetch/Prisma directly on the client.

### (b) Database — full schema + migration + seed

- `prisma/schema.prisma`:
  - datasource: `url = env("DATABASE_URL")` (pooled), `directUrl = env("DIRECT_URL")`.
  - generator: `prisma-client-js`, `previewFeatures = ["postgresqlExtensions"]`.
  - All enums from doc 03 §5.
  - All 26 models from doc 03 §7 with `@@map` snake_case, `@map` columns, tenant-leading `@@index`, `@@unique` per §9.2, relations + `onDelete` per §8.
- `prisma/migrations/…` — generated via `migrate dev`; then hand-edit `migration.sql` to add what Prisma DSL can't express (doc 03 §15 note):
  - check constraints §9.3 (non-negative weights/money, `net_weight <= gross_weight`, `karat BETWEEN 1 AND 24`, `amount > 0`, `rate_per_gram > 0`).
  - partial unique indexes `WHERE deleted_at IS NULL` (sku, phone, tag_number, gstin).
  - partial unique on live subscription per tenant.
  - trigram GIN on `customers.name`, `suppliers.name`, `products.name` (`pg_trgm`).
- `prisma/seed.ts` — idempotent `upsert`: `permissions` (full key catalog), `plans` (free/growth/enterprise), `hsn_codes` (7113/7114…), baseline `feature_flags`. Wire `package.json` `prisma.seed`.
- `lib/db.ts` — Prisma client singleton (avoid dev hot-reload leaks).

### (c) Auth wiring (doc 04 §5)

- `lib/auth/server.ts` — `stackServerApp` (Neon Auth server client), env keys `NEXT_PUBLIC_STACK_PROJECT_ID`, `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`, `STACK_SECRET_SERVER_KEY`.
- `app/handler/[...stack]/route.ts` — catch-all auth handler.
- `app/layout.tsx` — wrap with `<StackProvider app={stackServerApp}>` + `<StackTheme>`.
- `lib/auth/session.ts` — `requireSession()`: `stackServerApp.getUser()` → tenantId from `serverMetadata.activeTenantId` → verify active `UserTenantMembership` via Prisma → redirect to `/login` or `/select-tenant`. Returns `{ userId, tenantId, membershipId }`.
- `lib/db/tenant-scope.ts` — thin tenant-scoped repo helper (doc 04 §5.4), starter for invoices.
- `middleware.ts` — edge gate: unauthenticated hitting `(app)` routes → `/login`.
- `.env.example` — document all required env var names.

### (d) UI — auth pages + dashboard shell (doc 07 route groups)

- Route groups: `app/(auth)/…`, `app/(app)/…`.
- `(auth)/login/page.tsx` — RHF + Zod, email/password, gold-branded shadcn card, link to sign-up + forgot password. Calls Neon Auth client sign-in.
- `(auth)/sign-up/page.tsx` — name/email/password/business-name (onboarding shape per doc 04 §6.1).
- `(auth)/layout.tsx` — centered auth shell.
- `(app)/layout.tsx` — sidebar (permission-gated nav stubs: Dashboard, Billing, Inventory, Customers, Reports, Settings) + topbar (tenant switcher stub, user menu, theme toggle). Calls `requireSession()` server-side; passes tenant into `tenant-store`. Sidebar collapse driven by `ui-store` (Zustand). Topbar user menu / theme toggle are client, reading stores.
- `(app)/dashboard/page.tsx` — placeholder stat cards using `formatINRWords` (Today's Sales, Outstanding, Stock Value, Low Stock).
- `loading.tsx`, `error.tsx`, `not-found.tsx` at app root.
- `app/page.tsx` — redirect `/` → `/dashboard` (or `/login`).

## 4. File map (new/changed)

```
neon.ts                              (new — auth:true, dataApi optional)
.env.example                         (new)
prisma/schema.prisma                 (new)
prisma/seed.ts                       (new)
prisma/migrations/**                 (generated + hand-edited SQL)
lib/db.ts                            (new)
lib/format.ts                        (new)
components/providers.tsx             (new — QueryClient + theme + Stack)
lib/query/client.ts                  (new)
lib/query/keys.ts                    (new)
lib/query/hooks/*.ts                 (new — useQuery/useMutation wrappers)
lib/stores/ui-store.ts               (new — Zustand)
lib/stores/tenant-store.ts           (new — Zustand)
lib/stores/bill-draft-store.ts       (new — Zustand, POS stub)
lib/auth/server.ts                   (new)
lib/auth/session.ts                  (new)
lib/db/tenant-scope.ts               (new)
middleware.ts                        (new)
app/layout.tsx                       (changed — font, providers, metadata)
app/globals.css                      (changed — semantic tokens)
app/page.tsx                         (changed — redirect)
app/handler/[...stack]/route.ts      (new)
app/(auth)/layout.tsx                (new)
app/(auth)/login/page.tsx            (new)
app/(auth)/sign-up/page.tsx          (new)
app/(app)/layout.tsx                 (new)
app/(app)/dashboard/page.tsx         (new)
app/loading.tsx | error.tsx | not-found.tsx  (new)
components/ui/*                       (shadcn adds)
components/app/sidebar.tsx, topbar.tsx, theme-toggle.tsx  (new)
package.json                         (changed — deps + prisma.seed)
```

## 5. Out of scope (later phases)

- Actual billing engine / GST computation (doc 06), inventory workflows (doc 10), RBAC evaluation logic (doc 06), reports (doc 09), R2 uploads, rate limiting (Upstash), RLS hardening.
- Real business onboarding transaction beyond signup stub.
- Neon Auth provisioning (user runs `neon init` / adds keys).

## 6. Acceptance

1. `pnpm prisma validate` passes; schema has all 26 tables + enums.
2. Migration SQL includes check constraints, partial unique + trigram indexes.
3. `pnpm build` compiles with no type errors (given placeholder env).
4. Login + sign-up pages render, validate via Zod, styled with gold token.
5. `(app)` routes gated by `requireSession()` + middleware.
6. `formatINR(121.12)` → `₹121.12`; `formatINR(121212.5)` → `₹1,21,212.50`.
7. Seed is idempotent (re-run → no dupes).
8. `.env.example` documents every required var.
9. QueryClientProvider mounted app-wide; a sample `useQuery` hook + query-key factory exist; Devtools load in dev only.
10. Zustand stores exist (ui/tenant/bill-draft); sidebar collapse persists via `ui-store`; no server data duplicated into any store.
