# 12 — Coding Standards & Engineering Handbook

> **Document status:** Production spec · **Phase:** 1 (Next.js web only) · **Owner:** Platform Engineering
> **Related docs:** [`02-System-Architecture.md`](./02-System-Architecture.md) · [`03-Database-Design.md`](./03-Database-Design.md) · [`04-Authentication-Security.md`](./04-Authentication-Security.md) · [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md) · [`06-RBAC-Permissions.md`](./06-RBAC-Permissions.md) · [`08-Error-Handling.md`](./08-Error-Handling.md)

---

## 1. Executive Summary

This handbook is the **single source of truth for how we write, structure, test, review, and ship code** on the Jewellery ERP SaaS platform. It exists so that any engineer — new hire or founder — can open a file and immediately know *where it should live, what it should look like, and what guarantees it must uphold*.

The platform is a **multi-tenant SaaS for Indian jewellery businesses**, built as a **single Next.js (App Router) + TypeScript repository**. Because a single codebase serves many competing businesses, three properties are non-negotiable and are baked into these standards rather than left to individual judgement:

1. **Tenant isolation by construction** — every data access is tenant-scoped through a central mechanism, never through ad-hoc `where` clauses scattered across the code. See [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md).
2. **Deny-by-default authorization** — every mutation checks an explicit `resource:action` permission after auth and tenant resolution. See [`06-RBAC-Permissions.md`](./06-RBAC-Permissions.md).
3. **Financial correctness** — money and metal weight are **never** floats. Billing math is decimal, deterministic, and covered by mandatory tests.

These are not aspirations; they are **acceptance gates**. A PR that scatters raw `tenantId` filters, uses `number` for a price, or ships an ungated mutation is *incorrect by definition* and must not merge.

This document covers repository structure, TypeScript rules, naming, Next.js patterns, the data-access layer, validation, error handling, styling, state management, security coding rules, the testing strategy, Git workflow, CI/CD, tooling, documentation standards, observability, accessibility, performance, and typed environment configuration — each with concrete, copy-pasteable code.

---

## 2. Scope

**In scope**

- Repository and folder conventions for the single Next.js app.
- Language-level standards: TypeScript strictness, naming, typing discipline.
- Framework patterns: Server Components, Server Actions, Route Handlers, caching.
- The canonical **auth → tenant → permission → validate → service → return** mutation pattern.
- Data-access layer (repository/service), decimal money/weight handling, transactions.
- Validation (Zod), error handling, styling, state, security coding rules.
- Testing strategy and coverage targets.
- Git workflow, CI/CD, tooling, documentation, logging, a11y, performance, env config.
- A PR acceptance checklist.

**Out of scope (owned elsewhere)**

- The authorization model and permission catalogue → [`06-RBAC-Permissions.md`](./06-RBAC-Permissions.md).
- Tenant resolution and isolation guarantees → [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md).
- Auth/session/MFA → [`04-Authentication-Security.md`](./04-Authentication-Security.md).
- The physical database schema → [`03-Database-Design.md`](./03-Database-Design.md).
- The canonical error-code registry → [`08-Error-Handling.md`](./08-Error-Handling.md).

---

## 3. Assumptions

1. **Stack is fixed for Phase 1:** Next.js App Router + TypeScript, Tailwind CSS, shadcn/ui, React Hook Form (RHF), TanStack Query, Zod, Prisma, Neon PostgreSQL, Neon Auth, Cloudflare R2, Recharts, deployed on Vercel.
2. **Single repository, single deployable.** Backend logic lives in Route Handlers and Server Actions inside the same Next.js app — there is no separate API service in Phase 1.
3. Engineers use **Node 20 LTS**, **pnpm** as the package manager, and a TypeScript-aware editor (VS Code baseline config committed to the repo).
4. Every domain table carries a `tenant_id`; tenant context is resolved upstream and available to the data layer via a request-scoped context.
5. All examples assume **`strict: true`** TypeScript and ESM modules.

---

## 4. Repository & Folder Structure

The repo is organized by **layer and responsibility**, not by file type-per-se. UI, domain logic, and data access are physically separated so that tenant/permission guarantees live in one place.

```text
jewellery-erp/
├── app/                              # Next.js App Router (routing + UI only)
│   ├── (marketing)/                  # Public route group (landing, pricing)
│   ├── (auth)/                       # Sign-in / sign-up flows
│   │   ├── sign-in/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                        # Authenticated, tenant-scoped app
│   │   ├── layout.tsx                # Shell: sidebar, tenant guard
│   │   ├── dashboard/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx              # Server Component (list)
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [invoiceId]/page.tsx
│   │   └── settings/roles/page.tsx
│   ├── api/                          # Route Handlers (webhooks, uploads, cron)
│   │   ├── webhooks/stripe/route.ts
│   │   └── uploads/sign/route.ts
│   ├── layout.tsx                    # Root layout (html, providers)
│   └── globals.css
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (button, dialog, …)
│   └── features/                     # Feature components (invoice-form, …)
│       └── invoices/
│           ├── invoice-form.tsx
│           └── invoice-table.tsx
│
├── lib/                              # Framework-agnostic building blocks
│   ├── auth/                         # Session helpers over Neon Auth
│   │   └── require-session.ts
│   ├── db/
│   │   └── prisma.ts                 # PrismaClient singleton + tenant extension
│   ├── permissions/
│   │   ├── authorize.ts             # authorize(permission) guard
│   │   └── keys.ts                  # PERMISSION constants (resource:action)
│   ├── validation/                   # Cross-cutting Zod helpers
│   ├── money/
│   │   ├── money.ts                 # Decimal money type + ops
│   │   └── weight.ts                # Metal weight (grams) decimal ops
│   ├── errors/
│   │   └── app-error.ts             # AppError + error codes (see doc 08)
│   ├── logger.ts                     # Structured logger
│   └── utils.ts                      # cn(), small pure helpers
│
├── server/                           # Backend domain layer (server-only)
│   ├── actions/                      # Server Actions ("use server")
│   │   └── invoices/create-invoice.action.ts
│   ├── services/                     # Business logic / orchestration
│   │   └── invoices/invoice.service.ts
│   └── repositories/                 # Prisma data access (tenant-scoped)
│       └── invoices/invoice.repository.ts
│
├── db/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── types/                            # Shared ambient/domain types
│   ├── domain.ts
│   └── result.ts
│
├── config/
│   ├── env.ts                        # Typed, Zod-validated environment
│   └── site.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── component/
│   └── e2e/                          # Playwright
│
├── .github/workflows/ci.yml
├── eslint.config.mjs
├── prettier.config.mjs
├── vitest.config.ts
├── playwright.config.ts
└── tsconfig.json
```

**Golden rule of layering:** dependencies point *inward and downward only*.

```text
app/ (UI)  →  server/actions  →  server/services  →  server/repositories  →  lib/db (Prisma)
                                        │
                              lib/{money,permissions,errors,validation}
```

`components/` and `app/` must **never** import Prisma or a repository directly. UI talks to the server layer through Server Actions or Route Handlers only.

---

## 5. TypeScript Standards

- **`strict: true`** and the additional guards below are mandatory (`tsconfig.json`):

  ```jsonc
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitOverride": true,
      "noFallthroughCasesInSwitch": true,
      "exactOptionalPropertyTypes": true,
      "verbatimModuleSyntax": true,
      "moduleResolution": "Bundler",
      "target": "ES2022"
    }
  }
  ```

- **No `any`.** Use `unknown` at boundaries and narrow. `any` is banned by ESLint (`@typescript-eslint/no-explicit-any: error`). If an external lib forces it, isolate it behind a typed wrapper with a `// eslint-disable-next-line` and a comment explaining why.

- **`type` vs `interface`:**
  - `interface` for **object shapes that may be extended/implemented** (public component props, service contracts).
  - `type` for **unions, intersections, mapped/conditional types, and function types**.

- **Discriminated unions** for state and results — never boolean flags that can contradict each other:

  ```ts
  type LoadState<T> =
    | { status: "loading" }
    | { status: "error"; error: AppError }
    | { status: "ready"; data: T };
  ```

- **Zod is the source of truth** for any externally-shaped data. Derive the type; do not hand-write it:

  ```ts
  export const createInvoiceInput = z.object({
    customerId: z.string().uuid(),
    lines: z.array(invoiceLineInput).min(1),
  });
  export type CreateInvoiceInput = z.infer<typeof createInvoiceInput>;
  ```

- **DTO vs Domain typing.** Repositories return **Prisma-generated types** (or narrowed `select` results). Services map those to **domain types** in `types/domain.ts` when the shape crosses a boundary (e.g. serialized to the client). Never leak a Prisma model with `Decimal` fields straight to a client component — serialize money to string first (§9).

- **Prisma generated types:** import from `@prisma/client` (`Prisma.InvoiceGetPayload<...>`) instead of re-declaring row shapes. Use `Prisma.validator` for reusable `select`/`include` fragments.

---

## 6. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files & folders | `kebab-case` | `invoice-form.tsx`, `create-invoice.action.ts` |
| React components | `PascalCase` | `InvoiceForm`, `RoleTable` |
| Functions, variables | `camelCase` | `createInvoice`, `effectivePermissions` |
| Types & interfaces | `PascalCase` | `CreateInvoiceInput`, `InvoiceService` |
| Constants / enums values | `UPPER_SNAKE_CASE` | `MAX_LINE_ITEMS`, `DEFAULT_GST_RATE` |
| DB tables & columns | `snake_case` | `invoice_lines`, `tenant_id`, `created_at` |
| Prisma models (in schema) | `PascalCase` mapped via `@@map` | `model Invoice { @@map("invoices") }` |
| Permission keys | `resource:action` (lower) | `invoice:create`, `role:update` |
| Zod schemas | `camelCase` noun + suffix | `createInvoiceInput`, `invoiceLineSchema` |
| Server Action files | `*.action.ts` | `create-invoice.action.ts` |
| Service / repo files | `*.service.ts`, `*.repository.ts` | `invoice.service.ts` |
| Test files | `*.test.ts` / `*.spec.ts` | `money.test.ts` |
| Git branches | `type/short-desc` | `feat/invoice-builder`, `fix/gst-rounding` |
| Commits | Conventional Commits | `feat(invoices): add making-charge slab` |

**File suffix contract** — the suffix tells you the layer and its guarantees. A `*.action.ts` file **must** contain the guard chain of §8; a `*.repository.ts` file **must** be tenant-scoped and contain no business rules.

---

## 7. Next.js App Router Patterns

### 7.1 Server Components by default

Every component is a **Server Component** unless it needs interactivity. Do not add `"use client"` reflexively. A component needs `"use client"` only when it uses state/effects, event handlers, browser APIs, or client-only libraries.

```tsx
// app/(app)/invoices/page.tsx  — Server Component (no directive)
import { listInvoices } from "@/server/services/invoices/invoice.service";
import { requireSession } from "@/lib/auth/require-session";

export default async function InvoicesPage() {
  const { tenantId } = await requireSession();
  const invoices = await listInvoices({ tenantId });
  return <InvoiceTable invoices={invoices} />;
}
```

Push `"use client"` to the **leaf** (a form, a menu), not to the page. Pass server-fetched data down as props.

### 7.2 Server Action conventions

Server Actions are the **primary mutation path**. Every action follows the same order — **guard first, work last**:

1. Mark `"use server"`.
2. Resolve session (auth).
3. Resolve/validate tenant.
4. Check the required `resource:action` permission.
5. Validate input with Zod (`.safeParse`).
6. Delegate to a **service** (never inline Prisma).
7. Return a **typed `Result`** (never throw raw errors to the client).
8. `revalidatePath`/`revalidateTag` on success.

The canonical template lives in §8.4.

### 7.3 Route Handler conventions

Use Route Handlers (`app/api/**/route.ts`) only for **non-form** entry points: webhooks, signed upload URLs, cron, and third-party callbacks. Same guard order applies (auth → tenant → permission → validate), except webhooks authenticate via signature verification instead of a session.

```ts
// app/api/uploads/sign/route.ts
export async function POST(req: Request) {
  const { tenantId, userId } = await requireSession();
  await authorize("product:update", { tenantId, userId });

  const parsed = signUploadInput.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  }
  const url = await createSignedR2Upload(tenantId, parsed.data);
  return Response.json({ url });
}
```

### 7.4 Data fetching, caching & revalidation

- **Reads** happen in Server Components / services. Tenant-scoped data is **per-request** and must never be cached across tenants.
- Mark tenant-scoped fetches as dynamic: `export const dynamic = "force-dynamic"` on authenticated pages, or use `cookies()`/`headers()` (which opt a route into dynamic rendering) via the session helper.
- Use `revalidateTag`/`revalidatePath` **after mutations only**. Tag cache entries with tenant-qualified keys: `` `t:${tenantId}:invoices` ``.
- Never wrap tenant data in `unstable_cache` without the `tenantId` in both the key **and** the tags. A cache key that omits `tenantId` is a **cross-tenant leak** and fails review.

### 7.5 `error.tsx` and `loading.tsx`

- Every route segment with async data has a `loading.tsx` (skeleton) and an `error.tsx` (boundary).
- `error.tsx` renders a **user-safe** message and a retry button; it never renders `error.message` verbatim (may contain internals). Log the digest, show a friendly copy keyed by error code (§10).

---

## 8. Data Access Layer

### 8.1 Repository / Service pattern

- **Repository** = the *only* place that touches Prisma. Pure data access, no business rules. Always tenant-scoped.
- **Service** = business logic, orchestration, transactions, permission-independent invariants. Calls repositories.
- **Action / Route Handler** = the guarded entry point. Calls services.

```text
action  →  service  →  repository  →  prisma (tenant-extended)
```

### 8.2 Central tenant scoping (never scatter `tenantId`)

Tenant filtering lives in **one** place: a Prisma client extension that injects `tenant_id` into every query and write for tenant-owned models. Repositories receive `tenantId` and pass it to a request-scoped client — they do not hand-write `where: { tenantId }` on every call. See [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md) for the full mechanism.

```ts
// lib/db/prisma.ts (sketch — full impl in doc 05)
export function tenantScoped(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (TENANT_OWNED.has(model!)) {
            args.where = { ...(args.where ?? {}), tenantId };
            if (operation.startsWith("create") && args.data) {
              (args.data as Record<string, unknown>).tenantId = tenantId;
            }
          }
          return query(args);
        },
      },
    },
  });
}
```

**Rule:** a repository must obtain its client from `tenantScoped(tenantId)`. A raw `prisma.invoice.findMany()` inside a repository (bypassing the extension) is a review blocker.

### 8.3 Transactions & decimal handling

- Multi-step writes (create invoice + lines + adjust inventory + ledger entry) run inside `prisma.$transaction` so they commit atomically.
- **Money and weight are `Decimal`, never `number`.** DB columns are `NUMERIC`; Prisma maps them to `Prisma.Decimal`. All arithmetic uses the `Money`/`Weight` helpers in `lib/money`. Floats are banned for financial values (`0.1 + 0.2 !== 0.3`).

```ts
// lib/money/money.ts
import { Prisma } from "@prisma/client";
export type Money = Prisma.Decimal;
export const money = (v: string | number): Money => new Prisma.Decimal(v);
export const addMoney = (a: Money, b: Money): Money => a.plus(b);
export const mulRate = (a: Money, rate: Money): Money => a.times(rate);
/** Round to 2 dp using banker's-safe half-up for INR. */
export const toINR = (m: Money): string => m.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
```

Serialize to **string** at the boundary (`toINR`) before sending to a client component; never send `Decimal` objects or `number` money.

### 8.4 Canonical Server Action template

This is the reference every mutation copies. It embodies **auth → tenant → permission → validate → service → return**.

```ts
// server/actions/invoices/create-invoice.action.ts
"use server";

import { revalidateTag } from "next/cache";
import { requireSession } from "@/lib/auth/require-session";
import { authorize } from "@/lib/permissions/authorize";
import { PERMISSION } from "@/lib/permissions/keys";
import { createInvoiceInput } from "@/server/services/invoices/invoice.schema";
import { invoiceService } from "@/server/services/invoices/invoice.service";
import { AppError, toResult } from "@/lib/errors/app-error";
import type { Result } from "@/types/result";
import type { InvoiceDTO } from "@/types/domain";

export async function createInvoiceAction(
  raw: unknown,
): Promise<Result<InvoiceDTO>> {
  try {
    // 1. AUTH — who are you?
    const { userId, tenantId } = await requireSession();

    // 2. PERMISSION — allowed to do this here? (tenant already resolved in session)
    await authorize(PERMISSION.INVOICE_CREATE, { userId, tenantId });

    // 3. VALIDATE — parse at the boundary; never trust the client
    const parsed = createInvoiceInput.safeParse(raw);
    if (!parsed.success) {
      throw AppError.validation(parsed.error.flatten());
    }

    // 4. SERVICE — business logic + transaction live here, tenant-scoped
    const invoice = await invoiceService.create({ tenantId, userId, input: parsed.data });

    // 5. REVALIDATE affected caches (tenant-qualified tags)
    revalidateTag(`t:${tenantId}:invoices`);

    // 6. RETURN typed success
    return { ok: true, data: invoice };
  } catch (err) {
    // Map to a user-safe Result; log full detail server-side
    return toResult(err);
  }
}
```

Key points: **client-supplied `tenantId` is ignored** (it comes from the session); permission is checked **before** validation touches the DB; every path returns a `Result`, never an uncaught throw to the client.

### 8.5 Permission checks in every mutation

There is **no** mutation without an `authorize(...)` call. `authorize` throws `AppError.forbidden` when the permission is absent from the user's effective set. Reads of sensitive data (financials, other users' PII) are gated too. The permission catalogue and `authorize` semantics are in [`06-RBAC-Permissions.md`](./06-RBAC-Permissions.md).

---

## 9. Validation

- **Zod schemas are colocated** with the feature (`invoice.schema.ts`) and **shared** across client and server — the same schema powers the RHF resolver and the Server Action.

```ts
// server/services/invoices/invoice.schema.ts
export const invoiceLineInput = z.object({
  productId: z.string().uuid(),
  grossWeightG: z.string().regex(/^\d+(\.\d{1,3})?$/), // grams as string → Decimal
  purity: z.enum(["22K", "18K", "24K"]),
  makingChargeRate: z.string().regex(/^\d+(\.\d{1,2})?$/),
});
export const createInvoiceInput = z.object({
  customerId: z.string().uuid(),
  lines: z.array(invoiceLineInput).min(1).max(50),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceInput>;
```

- **Client:** `useForm({ resolver: zodResolver(createInvoiceInput) })`.
- **Server:** `createInvoiceInput.safeParse(raw)` at the action boundary.
- **Parse at every boundary** — Server Action input, Route Handler body, webhook payload, `env`, and third-party responses. Numeric money/weight cross the wire as **strings** and are converted to `Decimal` inside the service, never parsed as JS numbers.

---

## 10. Error Handling

- One typed error class, `AppError`, carries a **stable error code**, an HTTP-ish status, a **user-safe message**, and optional **internal detail** (logged, never returned).

```ts
// lib/errors/app-error.ts
export type ErrorCode =
  | "VALIDATION_ERROR" | "UNAUTHENTICATED" | "FORBIDDEN"
  | "NOT_FOUND" | "CONFLICT" | "TENANT_MISMATCH" | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly userMessage: string,   // safe to show
    readonly status = 400,
    readonly detail?: unknown,      // logged only
  ) { super(userMessage); }

  static validation(detail: unknown) {
    return new AppError("VALIDATION_ERROR", "Please check the highlighted fields.", 422, detail);
  }
  static forbidden() {
    return new AppError("FORBIDDEN", "You don't have permission to do this.", 403);
  }
}
```

- Mutations return a **`Result`** discriminated union rather than throwing across the client boundary:

  ```ts
  // types/result.ts
  export type Result<T> =
    | { ok: true; data: T }
    | { ok: false; code: ErrorCode; message: string };
  ```

- `toResult(err)` converts a thrown `AppError` into a safe `Result` and **logs the full detail** (with request id, no PII). Unknown errors collapse to `INTERNAL` with a generic message — internals are never leaked.
- The **canonical error-code registry** (codes, HTTP mapping, user copy) is maintained in [`08-Error-Handling.md`](./08-Error-Handling.md); this doc references it rather than duplicating it.

---

## 11. Styling

- **Tailwind CSS first.** No custom CSS files beyond `globals.css` and design-token declarations. No inline magic values — use tokens (`text-muted-foreground`, `p-4`) not `style={{ padding: 13 }}`.
- **shadcn/ui** for primitives (button, dialog, form, table). Extend via the `cn()` helper + `class-variance-authority`, never by forking the primitive.

  ```ts
  // lib/utils.ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
  ```

- **Class ordering** is enforced automatically by `prettier-plugin-tailwindcss` — do not hand-order classes; run Prettier.
- **Design tokens** (colors, radius, spacing) live in `globals.css` / `tailwind.config` as CSS variables. Components reference semantic tokens (`bg-background`, `text-primary`) so **dark mode** works via the `.dark` class with zero component changes.
- Prefer composition over conditionals-in-JSX; extract variant logic to `cva`.

---

## 12. State Management

- **Server state** is owned by **TanStack Query** on the client where interactivity requires it; otherwise data comes from Server Components. Do not mirror server data into `useState`.
- **Query key convention:** tenant-qualified, hierarchical arrays.

  ```ts
  export const invoiceKeys = {
    all: (t: string) => ["t", t, "invoices"] as const,
    list: (t: string, filters: InvoiceFilters) => [...invoiceKeys.all(t), "list", filters] as const,
    detail: (t: string, id: string) => [...invoiceKeys.all(t), "detail", id] as const,
  };
  ```

- **Invalidation:** after a mutation, invalidate the narrowest matching key (`queryClient.invalidateQueries({ queryKey: invoiceKeys.all(tenantId) })`). Server Actions additionally `revalidateTag` for SSR caches.
- **Client state is minimal** — UI-only concerns (open/closed, selected tab) via `useState`/`useReducer`. No global client store for domain data in Phase 1.
- **Forms** use **React Hook Form** with the Zod resolver; RHF owns form state, Zod owns validation, TanStack Query owns submission side effects.

---

## 13. Security Coding Rules

These are coding-level obligations; the threat model and controls are in [`04-Authentication-Security.md`](./04-Authentication-Security.md) and [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md).

- **Never trust a client-supplied `tenantId`.** It always comes from the resolved session. Any action parameter named `tenantId` is a design smell and fails review.
- **Parameterized queries only.** Use Prisma's typed API. `$queryRaw`/`$executeRaw` are allowed **only** with tagged-template parameters (never string interpolation) and must still be tenant-scoped explicitly.
- **Sanitize rich text** (customer notes, descriptions) with an allow-list sanitizer before storage and escape on render. Never `dangerouslySetInnerHTML` with unsanitized input.
- **R2 uploads are signed & server-issued.** Clients receive a short-lived signed URL from a permission-gated Route Handler; they never hold R2 credentials. Validate content-type and size server-side.
- **Secrets are server-only.** Anything sensitive lives without the `NEXT_PUBLIC_` prefix and is read via `config/env.ts`. Client bundles must contain zero secrets.
- **Output encoding:** rely on React's default escaping; encode when building URLs, filenames, or CSV/PDF exports.
- **Authorization before work:** every mutation and sensitive read calls `authorize(...)` first (§8).

---

## 14. Testing Strategy

Testing is **risk-weighted**: the most business-critical, hardest-to-eyeball logic gets the deepest coverage.

| Layer | Tool | What it covers | Mandatory? |
|---|---|---|---|
| Unit | Vitest | Billing calc engine, money/weight helpers, permission logic, pure utils | **Yes** for calc + permissions + money |
| Integration | Vitest + Prisma (Neon test branch) | Services + repositories, tenant scoping, transactions | **Yes** for tenant isolation |
| Component | Vitest + Testing Library | Forms, tables, RBAC UI gating (`<Can>`) | Recommended |
| E2E | Playwright | Login, create-invoice, role management critical paths | **Yes** for login + create invoice |

**Mandatory, non-negotiable tests:**

1. **Billing calculations** — every making-charge slab, purity conversion, GST, discount, and rounding case. Golden-file fixtures with known INR outputs.
2. **Tenant isolation** — a test proving Tenant A **cannot** read/write Tenant B's rows through any repository, even with a forged `tenantId` argument.

```ts
// tests/integration/tenant-isolation.test.ts
it("prevents cross-tenant invoice reads", async () => {
  const a = await seedTenant();
  const b = await seedTenant();
  const inv = await invoiceService.create({ tenantId: a.id, userId: a.owner, input: sample });

  const repoB = invoiceRepository(b.id);
  await expect(repoB.findById(inv.id)).resolves.toBeNull(); // extension scopes it out
});
```

**Coverage targets:**

| Area | Line coverage target |
|---|---|
| `lib/money`, billing calc engine | **100%** |
| `lib/permissions` | **95%** |
| `server/services` | **85%** |
| `server/repositories` | **80%** |
| Overall project | **≥ 80%** |

**Test naming/structure:** one `describe` per unit, `it("does X when Y")` behavioral names, Arrange-Act-Assert body, no shared mutable state between tests. Integration tests run against a **Neon branch** provisioned per CI run and torn down after.

---

## 15. Git Workflow

- **Trunk-based with short-lived branches.** `main` is always deployable; feature branches live hours-to-days, not weeks.
- **Branch naming:** `feat/…`, `fix/…`, `chore/…`, `refactor/…`, `docs/…`, `test/…` (e.g. `feat/invoice-builder`).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org) — `type(scope): summary`. Enforced by `commitlint`.
- **`main` is protected:** no direct pushes; PR + green checks + one approval required.

**PR template (`.github/pull_request_template.md`) includes:**

- What & why, linked issue.
- Screenshots for UI.
- Migration note (if `schema.prisma` changed).
- The acceptance checklist (§20).

**Review checklist (reviewer):**

- [ ] Tenant scoping via central extension — no scattered `where: { tenantId }`.
- [ ] Every mutation guarded with `authorize(...)`.
- [ ] Money/weight are `Decimal`, serialized as strings at boundaries.
- [ ] Zod validation at every boundary; types derived via `z.infer`.
- [ ] No `any`; no secrets in client bundle.
- [ ] Tests added for calc/isolation-affecting changes.

---

## 16. CI/CD

**GitHub Actions** run on every PR (`.github/workflows/ci.yml`):

```yaml
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint             # ESLint
      - run: pnpm typecheck        # tsc --noEmit
      - run: pnpm prisma validate  # schema integrity
      - run: pnpm test -- --coverage
      - run: pnpm build            # next build
```

**Required checks (branch protection):** lint, typecheck, `prisma validate`, test, build. All must pass to merge.

**Preview & migrations:**

- **Vercel preview per PR** with a **Neon branch per preview** (isolated data) wired via the Neon–Vercel integration.
- **Migration strategy:** developers author migrations with `prisma migrate dev` locally. CI runs `prisma migrate deploy` against the preview Neon branch. Production deploys run `prisma migrate deploy` as a release step **before** the new build serves traffic. Migrations are **forward-only** and **backward-compatible** (expand → migrate → contract) so a rollback of app code never breaks against the new schema. See [`03-Database-Design.md`](./03-Database-Design.md).

---

## 17. Tooling

- **ESLint** (`eslint.config.mjs`, flat config): `next/core-web-vitals`, `@typescript-eslint` strict, `no-explicit-any: error`, `no-floating-promises: error`, import-ordering.
- **Prettier** (`prettier.config.mjs`) with **`prettier-plugin-tailwindcss`** for automatic class ordering.
- **Husky + lint-staged** pre-commit: run ESLint + Prettier on staged files only.

  ```json
  // package.json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
  ```

- **commitlint** on `commit-msg` enforces Conventional Commits.
- **`tsc --noEmit`** (`pnpm typecheck`) both pre-push and in CI.

---

## 18. Documentation Standards

- **TSDoc** on exported services, public helpers, and any non-obvious logic (especially billing math): document *why*, invariants, and units (grams, INR).
- **ADRs** (Architecture Decision Records) live in `docs/adr/NNNN-title.md` using the "Context / Decision / Consequences" format. Any significant technical choice (ORM, auth provider, caching model) gets an ADR.
- **These `docs/` specs are living documents** — a PR that changes behavior described here must update the relevant doc in the same PR.
- **CHANGELOG.md** is generated from Conventional Commits on release.

---

## 19. Observability, Accessibility & Performance

**Logging / observability**

- Use the structured `lib/logger.ts` (JSON logs), never `console.log` in server code.
- Every server entry point attaches a **request id** and `tenantId` to the log context.
- **No PII in logs** — no customer names, phone numbers, or full invoices; log identifiers (`invoiceId`, `tenantId`) instead.

```ts
logger.info("invoice.created", { requestId, tenantId, invoiceId: inv.id });
```

**Accessibility**

- Semantic HTML + shadcn/ui (Radix) for accessible primitives; every interactive element is keyboard-reachable with a visible focus ring.
- All inputs have associated `<label>`s (RHF `FormLabel`); images and icon-buttons have `alt`/`aria-label`.
- Color is never the sole signal; contrast meets WCAG AA in both themes.

**Performance**

- Keep client bundles small: default to Server Components, `dynamic()`-import heavy client widgets (Recharts, editors).
- Use `next/image`; avoid unbounded `select`/`include` in Prisma (fetch only needed columns).
- Paginate lists; never `findMany` an entire tenant table for a UI page.

---

## 20. Environment Variables & Config

Environment is **typed and validated at startup** with Zod — the app refuses to boot on a misconfiguration rather than failing at runtime.

```ts
// config/env.ts
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),               // Prisma migrations (unpooled)
  NEON_AUTH_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),      // only NEXT_PUBLIC_ is client-exposed
});

export const env = schema.parse(process.env); // throws on boot if invalid
export type Env = z.infer<typeof schema>;
```

- Access config only through `env` — never `process.env.X` directly outside `config/env.ts`.
- Only `NEXT_PUBLIC_*` variables reach the client; everything else is server-only.
- `.env.example` documents every variable and is committed; real `.env` files are git-ignored.

---

## 21. Acceptance Criteria — PR Checklist

A PR is mergeable only when **every** row is satisfied.

| # | Criterion | Gate |
|---|---|---|
| 1 | `pnpm lint`, `typecheck`, `test`, `prisma validate`, `build` all green | CI |
| 2 | No `any`; no unused exports; no `console.log` in server code | ESLint |
| 3 | Every mutation follows auth → tenant → permission → validate → service → return | Review |
| 4 | Tenant scoping via central Prisma extension; **no** scattered `tenantId` filters | Review |
| 5 | Client-supplied `tenantId` is never trusted | Review |
| 6 | Money & weight use `Decimal`; serialized as strings at boundaries; no floats | Review + tests |
| 7 | Zod validation at every boundary; types via `z.infer` | Review |
| 8 | Mandatory tests present for billing calc and tenant isolation changes | CI + Review |
| 9 | Coverage targets (§14) met for touched areas | CI |
| 10 | Errors mapped to `AppError`/`Result`; no internals leaked; codes match doc 08 | Review |
| 11 | Tailwind classes Prettier-ordered; tokens used; dark mode intact | CI + Review |
| 12 | No PII in logs; request id + tenantId attached | Review |
| 13 | New env vars added to `config/env.ts` schema and `.env.example` | Review |
| 14 | Affected `docs/` and ADRs updated; Conventional Commit messages | Review |
| 15 | Migrations are forward-only, expand→contract, and reviewed | Review |

---

## 22. Future Enhancements

- **Monorepo split** (Turborepo) when a mobile app or standalone API is introduced in later phases — extract `lib/` and `server/services` into shared packages.
- **Contract tests** (e.g. schema snapshotting) between server actions and clients.
- **Mutation testing** (Stryker) on the billing calc engine to validate test strength.
- **Automated a11y checks** (axe) in Playwright E2E.
- **OpenTelemetry** tracing across actions → services → Prisma, with per-tenant dashboards.
- **Feature-flag / entitlement gating** codified as a lint rule so plan-restricted code paths are statically verifiable.
- **Generated API SDK** and typed RPC layer if a public API is exposed.

---

## 23. References

- [`02-System-Architecture.md`](./02-System-Architecture.md) — system layering and deployment topology.
- [`03-Database-Design.md`](./03-Database-Design.md) — schema, migrations, decimal columns.
- [`04-Authentication-Security.md`](./04-Authentication-Security.md) — auth, sessions, threat model.
- [`05-Multi-Tenancy.md`](./05-Multi-Tenancy.md) — tenant resolution and the Prisma tenant extension.
- [`06-RBAC-Permissions.md`](./06-RBAC-Permissions.md) — permission catalogue and `authorize`.
- [`08-Error-Handling.md`](./08-Error-Handling.md) — canonical error-code registry.
- Next.js App Router, Prisma, Zod, TanStack Query, Tailwind CSS, shadcn/ui, Vitest, Playwright, Conventional Commits — official documentation.

---

*End of document 12 — Coding Standards & Engineering Handbook.*
