# Phase 1 — Core Tenant + Auth + RBAC Design

> **Date:** 2026-07-02 · **Status:** Draft (for ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,approval)
> **Roadmap:** doc 11 §6 "Phase 1 — Core Tenant + Auth + RBAC" (≈2 sprints)
> **Sources:** `04-Authentication-Security.md`, `05-Multi-Tenancy.md`, `06-RBAC-Permissions.md`, `11-Development-Roadmap.md`
> **Target repo:** `jewellery-erp` (Next.js 16 App Router, Prisma 7 + Neon, Neon Auth / Better Auth).

## 1. Goal

Turn the base setup (Phase 0 foundations + auth scaffolding) into the **security bedrock**: a user signs up and gets a tenant, signs in, a tenant is resolved per request, every query is tenant-scoped, and every mutation is permission-gated deny-by-default. Two tenants must coexist with **zero data bleed** (proven by tests).

**Roadmap exit criteria (must all hold):**
1. Two tenants coexist with zero data bleed — verified by an isolation test suite.
2. Every `(app)` route/action is deny-by-default (`authorize()` present).
3. An owner can invite a user and assign a role that is enforced server-side.

## 2. Current state (from audit)

**EXISTS (working):** Neon Auth server/client, `requireSession()`, `proxy.ts` route gate, auth API handler, login/sign-up forms, app shell (sidebar/topbar/tenant-hydrator), full 26-table schema incl. RBAC models, permission seed (~26 keys), `(app)` layout calling `requireSession()`.

**STUB / MISSING (this phase closes):**
- `lib/db/tenant-scope.ts` — stub, unused. No tenant-scoped Prisma extension.
- Tenant creation on sign-up — `businessName` collected but discarded; no `Tenant`/membership/roles created.
- `app/(auth)/select-tenant/page.tsx` — placeholder text only.
- `authorize()` guard — MISSING. No `<Can>` gate. No permission resolution.
- Per-tenant role seeding (Owner/Manager/Cashier/Inventory Manager/Accountant) — MISSING.
- User invite + role assignment (UI + actions) — MISSING.
- Last-owner protection, plan-limit gating — MISSING.
- Tests (isolation + authz) — MISSING. No test runner.
- `.env.example`, CI migration/isolation gate — MISSING.

## 3. Decisions

| Decision | Choice | Source |
| --- | --- | --- |
| Tenant resolution | Server-side only, from Neon Auth session → app `User` → active `UserTenantMembership`. Client never supplies `tenantId`. | doc 05 §tenant resolution |
| Request tenant context | `AsyncLocalStorage` (`tenantStore`) holding `{ tenantId, userId, isSuperAdmin }`. | doc 05 §7.3 |
| Query isolation | Prisma `$extends` query interceptor: inject `tenantId` on filter ops, stamp on writes, reject mismatched client `tenantId`. Global models (Tenant/Plan/Permission/…) bypass. | doc 05 §7.3 |
| Authorization | `authorize(permission)` deny-by-default guard; resolves session → membership → roles → permissions; intersect with plan entitlements. `AuthorizationError` → 403. | doc 06 §authorize |
| Permission resolution | `getEffectivePermissions(userId, tenantId)` wrapped in React `cache()` (per-request), returns `Set<string>`. Super-admin short-circuits to platform perms. | doc 06 |
| UI gate | `<Can permission>` server component — cosmetic only; server `authorize()` is authoritative. | doc 06 |
| Seed roles | 5 tenant roles seeded **per tenant at onboarding** (not global): Owner, Manager, Cashier, Inventory Manager, Accountant, with doc 06 §7 permission matrix. `isSystem=true`. | doc 06 §7, doc 03 §14 |
| Sign-up → tenant | Atomic onboarding transaction: create `User` projection + `Tenant` + `BusinessSetting` + seed roles + `UserTenantMembership` + assign Owner role. | doc 05 AC-9 |
| Multi-tenant switch | `select-tenant` picker for users with >1 active membership. In-app switcher stub only (deferred; single active membership is the common path). | roadmap / doc 05 |
| Tests | **Vitest** for unit + integration (against a Neon dev branch), isolation harness seeding ≥2 tenants. Playwright deferred to a later slice. | doc 11 §13 |
| Audit | Write `audit_logs` on role assign/unassign, invite, tenant create (actor, tenant, action, target). | doc 06 §15, doc 03 §12 |

**Adaptation note (Better Auth beta):** the SDK exposes no custom session metadata, so "active tenant" is derived from memberships (already how `requireSession()` works). No `serverMetadata.activeTenantId`. Documented; not a blocker.

## 4. Build sequence

Thin vertical slices, each demo-able. Order respects doc 10 dependency graph (Auth → Tenancy → RBAC → User Mgmt).

### (a) Tenant context + scoped Prisma extension

- `lib/db/tenant-context.ts` — `AsyncLocalStorage<TenantContext>`, `getTenantContext()`, `runWithTenant(ctx, fn)`.
- `lib/db.ts` — wrap the client with `$extends` query interceptor (inject/stamp/reject per doc 05 §7.3). Keep the singleton + Neon adapter. Define `GLOBAL_MODELS` set (Tenant, Plan, Permission, HsnCode, FeatureFlag, User by authUserId lookup path). AuditLog is tenant-nullable — treat as scoped-when-present.
- Replace `lib/db/tenant-scope.ts` stub: either delete in favour of the extension, or keep as a typed convenience wrapper over the scoped client.
- Bind context in `(app)/layout.tsx` (and server actions) after `requireSession()`.

### (b) Onboarding — tenant creation on sign-up

- `lib/tenants/onboard.ts` — `onboardBusiness({ authUserId, email, ownerName, businessName })` in a single `prisma.$transaction`: upsert `User`, create `Tenant` (+ slug), `BusinessSetting`, seed 5 system roles with permission grants, `UserTenantMembership`, assign Owner `UserRole`. Idempotent-safe on retry.
- `lib/rbac/seed-tenant-roles.ts` — role→permission matrix (doc 06 §7) applied per tenant.
- Wire sign-up: after `authClient.signUp.email` success, call a server action that runs `onboardBusiness`, then redirect `/dashboard`. `businessName` now used.
- Audit: `tenant:create`, `role:assign` (owner).

### (c) RBAC engine — authorize + Can

- `lib/rbac/permissions.ts` — `getEffectivePermissions(userId, tenantId)` (React `cache`), `hasPermission(ctx, key)`.
- `lib/rbac/authorize.ts` — `authorize(permission)` guard + `AuthorizationError`; composes session + plan entitlement check + permission.
- `lib/billing/entitlements.ts` — `assertPlanAllows(tenantId, permission)` (plan feature/limits; stub-safe: allow when no subscription row, log).
- `components/rbac/can.tsx` — `<Can permission fallback>` server component.
- Apply `<Can>`-gated nav in `app-sidebar.tsx` (hide items lacking `*:read`).

### (d) User management — invite + roles UI

- Schema: add `Invitation` model (token, tenantId, email, roleId, status, expiresAt) — new migration (forward-only) + partial-unique on pending token.
- Server actions (all `authorize()`-gated): `inviteUser` (`user:manage`), `acceptInvite`, `assignRole`/`revokeRole` (`role:manage`), `deactivateMember`. **Last-owner protection** in revoke/deactivate.
- `app/(app)/settings/users/page.tsx` — member list + role assignment (gated).
- `app/(auth)/invite/[token]/page.tsx` — accept-invite flow (auth then join tenant).
- `app/(auth)/select-tenant/page.tsx` — replace stub: list active memberships, pick one (sets nothing server-side beyond navigation; single-membership auto-resolves via `requireSession`).
- Audit on every mutation.

### (e) Tests + CI gate

- Add Vitest + config; test DB via Neon dev branch env.
- **Isolation harness** (doc 05 AC-2/3/4/5/7/13): seed 2 tenants; assert tenant A context can't read/update/delete tenant B rows; missing context throws; spoofed `tenantId` rejected.
- **Authz tests** (doc 06 AC): deny-by-default; role→permission resolution; last-owner protection; custom-role no-escalation (if custom roles included).
- Unit: onboarding transaction, permission set resolution.
- `.env.example` documenting all vars (DATABASE_URL, DIRECT_URL, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET).
- CI (GitHub Actions): lint · typecheck · vitest · `prisma migrate diff`/deploy check on a Neon branch.

## 5. File map (new/changed)

```
lib/db/tenant-context.ts            (new — AsyncLocalStorage)
lib/db.ts                           (changed — $extends scoped interceptor)
lib/db/tenant-scope.ts              (changed/removed — folded into extension)
lib/tenants/onboard.ts              (new — atomic onboarding tx)
lib/rbac/seed-tenant-roles.ts       (new — per-tenant role matrix)
lib/rbac/permissions.ts             (new — getEffectivePermissions/hasPermission)
lib/rbac/authorize.ts               (new — authorize() + AuthorizationError)
lib/billing/entitlements.ts         (new — assertPlanAllows, stub-safe)
components/rbac/can.tsx             (new — <Can>)
app/(auth)/sign-up/…                (changed — call onboardBusiness)
app/(auth)/select-tenant/page.tsx   (changed — real picker)
app/(auth)/invite/[token]/page.tsx  (new — accept invite)
app/(app)/settings/users/page.tsx   (new — members + roles)
app/(app)/settings/users/actions.ts (new — invite/assign/revoke server actions)
components/app/app-sidebar.tsx      (changed — permission-gated nav)
prisma/schema.prisma                (changed — Invitation model)
prisma/migrations/**                (new — invitations + partial unique)
vitest.config.ts                    (new)
tests/isolation/*.test.ts           (new — cross-tenant harness)
tests/rbac/*.test.ts                (new — authorize/last-owner)
.env.example                        (new)
.github/workflows/ci.yml            (new — lint/type/test/migrate gate)
```

## 6. Out of scope (later phases)

- Business Settings UI beyond the onboarding row (Phase 2a).
- Customer/Supplier/Inventory CRUD (Phase 2).
- Postgres RLS hardening (doc 05 F1 — future).
- In-app live tenant switcher without re-nav; email verification; password reset; MFA (doc 04 §security — Should, later slice).
- Subscription/plan management UI + full plan-limit enforcement (Phase 5); entitlements ship stub-safe now.
- Playwright e2e (Phase 6 regression).

## 7. Acceptance

1. Sign-up creates `User` + `Tenant` + `BusinessSetting` + 5 seeded roles + Owner membership atomically; failure leaves no partial tenant.
2. `requireSession()` + tenant context bound per request; `getTenantContext()` throws when unbound (never runs unscoped).
3. Prisma extension: tenant A context returns zero tenant B rows on find/count/aggregate; update/delete of tenant B key affects 0 rows; spoofed `tenantId` in args rejected; writes stamp session `tenantId`.
4. `authorize(permission)` denies by default; 403 on missing/unknown permission; passes for granted role permission.
5. Sidebar hides nav items the user lacks `*:read` for; server still blocks a forged action for the same permission.
6. Owner invites a user; invitee accepts; owner assigns a role; the role is enforced on the next request.
7. Last-owner protection: revoking/deactivating the final Owner is rejected.
8. Isolation test suite green (≥2 tenants, per-model, not sampled); authz tests green; CI blocks a bad migration.
9. `.env.example` documents every required var; `pnpm build` + `pnpm test` pass.
```
