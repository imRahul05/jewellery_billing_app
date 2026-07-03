# Jewellery ERP

A production-grade, multi-tenant Enterprise Resource Planning system built for jewellery businesses. Handles billing, inventory, supplier/customer management, metal rate pricing, role-based access control, and more — all scoped per business tenant.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 6 (strict mode) |
| Database | [Neon](https://neon.tech) (Serverless PostgreSQL) |
| ORM | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-neon` |
| Auth | [Neon Auth](https://neon.tech/docs/guides/neon-auth) |
| State | [Zustand 5](https://zustand-demo.pmnd.rs/) + [TanStack Query 5](https://tanstack.com/query/latest) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) |
| Testing | [Vitest 4](https://vitest.dev/) |
| CI | GitHub Actions |

---

## Project Status

| Phase | Description | Status |
|---|---|---|
| **Base Setup** | Foundations, Database Schema, Auth wiring, UI Shell | ✅ Complete |
| **Phase 1** | Multi-Tenancy, RBAC Engine, User Invitations | ✅ Complete |
| **Phase 2** | Master Data APIs (Customers, Suppliers, Assets, Inventory) | ✅ Complete |
| **Refactoring Phase 1** | Server-side Query Segregation (Data Access Layer) | ✅ Complete |
| **Refactoring Phase 2** | Next.js Server Components Migration with SearchParams | ✅ Complete |
| **Refactoring Phase 3** | Custom React Query Hooks & useEffect Clean-up | ✅ Complete |
| **Performance & Caching** | React `"use cache"` & Cache Tag Invalidation | ✅ Complete |

---

## App Router Caching & Data Flow

Our architecture utilizes Next.js 16 App Router best practices, optimizing both data fetching latency and client interactivity:

### 1. Server-Side Data Access Layer (DAL)
All Prisma queries are segregated into `lib/db/queries/*.ts` files with `"server-only"` protection. Direct DB querying within Page files or Client Components is blocked.

### 2. Next.js 16 Caching & Invalidation
- **React `"use cache"`**: Integrated React's experimental `"use cache"`, `cacheLife`, and `cacheTag` directives into server-side queries (User, Tenant, Customer, Supplier lists).
- **Dynamic Routing**: Removed `force-dynamic` directives from list pages to allow dynamic cache compilation, invalidating lists selectively when database mutations succeed.

### 3. TanStack Query + Hybrid Data Hydration
- Client wrappers (`_components/*-client-wrapper.tsx`) consume data from custom hooks.
- Server Components query the database directly during server rendering and pass the results to wrappers as `initialData`. This results in **zero loading latency** for initial render while preserving React Query's mutation cache-invalidation benefits.
- All client state modifications utilize centralized query/mutation hooks (`lib/query/hooks/`), invalidating appropriate cache tags on mutation successes to guarantee consistent UI updates.


---

## Architecture Overview

```
jewellery-erp/
├── app/
│   ├── (app)/                  # Protected application routes
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── customers/          # Customer management UI
│   │   ├── suppliers/          # Supplier management UI
│   │   ├── inventory/          # Inventory management UI
│   │   └── settings/
│   │       └── users/          # Team & roles management UI
│   ├── (auth)/                 # Public auth routes
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── invite/[token]/     # Invitation acceptance page
│   │   └── select-tenant/      # Multi-business selector & onboarding
│   └── api/
│       ├── auth/               # Neon Auth route handler
│       └── v1/                 # REST API (all tenant-scoped)
│           ├── assets/
│           ├── customers/
│           ├── inventory/
│           ├── settings/
│           └── suppliers/
├── components/
│   ├── app/                    # App shell (AppSidebar, Topbar)
│   ├── auth/                   # Auth UI components
│   ├── rbac/                   # <Can> server gate component
│   └── ui/                     # shadcn/ui primitives
├── lib/
│   ├── db.ts                   # Prisma client + tenant-scoped interceptor
│   ├── db/
│   │   ├── tenant-context.ts   # AsyncLocalStorage tenant context
│   │   └── tenant-scope.ts     # Tenant repository wrapper
│   ├── auth/
│   │   ├── session.ts          # Session validation & tenant membership
│   │   └── with-tenant.ts      # RSC/Server Action wrapper
│   ├── rbac/
│   │   ├── permissions.ts      # Permission resolution with request-scope cache
│   │   ├── authorize.ts        # Deny-by-default guard
│   │   └── seed-tenant-roles.ts # Default role provisioning
│   ├── billing/
│   │   └── entitlements.ts     # Subscription plan limit checks
│   ├── tenants/
│   │   └── onboard.ts          # Atomic tenant onboarding transaction
│   ├── stores/                 # Zustand stores (ui, tenant, bill-draft)
│   ├── query/                  # TanStack Query client & key factories
│   └── format.ts               # Indian rupee & weight formatters
├── prisma/
│   ├── schema.prisma           # 29-model schema
│   ├── seed.ts                 # Idempotent seed (permissions, plans, HSN)
│   └── migrations/             # SQL migrations
└── tests/
    ├── isolation.test.ts       # Cross-tenant isolation tests
    ├── rbac.test.ts            # RBAC & authorization tests
    └── phase2.test.ts          # Master data & operations integration tests
```

---

## Key Features

### Multi-Tenancy
- Every database query is automatically scoped to the active tenant via a Prisma query-level interceptor (`lib/db.ts`).
- `AsyncLocalStorage` (`lib/db/tenant-context.ts`) propagates `tenantId`, `userId`, and `isSuperAdmin` transparently across the request lifecycle without prop drilling.
- Cross-tenant data spoofing is rejected at the interceptor level.

### Role-Based Access Control (RBAC)
- Five default system roles provisioned per tenant: **Owner**, **Manager**, **Cashier**, **Inventory Manager**, **Accountant**.
- Permissions are granular (e.g. `customer:read`, `inventory:adjust`, `invoice:cancel`) and resolved with a request-scoped cache.
- `authorize()` guard is deny-by-default — it validates session, tenant membership, permissions, and plan entitlements in one call.
- `<Can permission="...">` server component gates UI sections without client-side logic.

### User Management & Invitations
- Staff can be invited by email token, assigned/revoked roles, and deactivated.
- **Last-owner protection** prevents a tenant from being left without an Owner.
- Multi-business users land on a dynamic tenant picker after login.

### Database
- 29 Prisma models covering tenants, users, memberships, invitations, RBAC, customers, suppliers, assets, inventory, billing, payments, metal rates, reports, audit logs, and more.
- Neon serverless driver with connection pooling for low-latency edge queries.
- PG trigram indexes and custom numeric check constraints via raw SQL migrations.

### Subscription & Entitlements
- Plan-based limits enforced at the server level (invoice volume, user count).

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Neon](https://console.neon.tech) project with **Neon Auth** enabled

### 1. Clone & Install

```bash
git clone <repo-url>
cd jewellery-erp
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Neon credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Neon connection string (for runtime & Prisma Client) |
| `DIRECT_URL` | Direct Neon connection string (for `prisma migrate`) |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint from your branch config |
| `VITE_NEON_AUTH_URL` | Neon Auth client URL |
| `NEON_AUTH_COOKIE_SECRET` | Cookie signing secret (min 32 chars) |

### 3. Set Up the Database

```bash
# Apply all migrations
pnpm db:migrate

# Generate the Prisma client
pnpm db:generate

# Seed initial data (permissions, subscription plans, HSN codes)
pnpm db:seed
```

### 4. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the Vitest test suite |
| `pnpm db:generate` | Regenerate the Prisma client after schema changes |
| `pnpm db:migrate` | Deploy pending migrations (production) |
| `pnpm db:migrate:dev` | Create and apply a new migration (development) |
| `pnpm db:seed` | Run the idempotent database seed |

---

## Testing

Tests are written with [Vitest](https://vitest.dev/) and run against a real Neon database using the tenant context infrastructure.

```bash
pnpm test
```

| Test File | Coverage |
|---|---|
| `tests/isolation.test.ts` | Confirms complete data isolation between different tenants |
| `tests/rbac.test.ts` | Permission checks, authorize guards, last-owner protection |
| `tests/phase2.test.ts` | Master data APIs: customers, suppliers, assets, inventory |

---

## CI / CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request:

1. TypeScript compilation check
2. ESLint linting
3. Prisma migration validation
4. Full Vitest test suite

---

## API Routes (v1)

All routes are under `/api/v1/` and are tenant-scoped. A valid Neon Auth session is required for all endpoints.

| Route | Methods | Description |
|---|---|---|
| `/api/v1/customers` | `GET`, `POST` | List and create customers |
| `/api/v1/customers/[id]` | `GET`, `PUT`, `DELETE` | Read, update, delete a customer |
| `/api/v1/suppliers` | `GET`, `POST` | List and create suppliers |
| `/api/v1/suppliers/[id]` | `GET`, `PUT`, `DELETE` | Read, update, delete a supplier |
| `/api/v1/assets` | `GET`, `POST` | List and create jewellery assets |
| `/api/v1/inventory` | `GET`, `POST` | List and create inventory entries |
| `/api/v1/settings` | `GET`, `PUT` | Read and update business settings |

---

## Contributing

1. Create a feature branch from `main`.
2. Run `pnpm lint` and `pnpm test` before opening a PR.
3. All new database changes must include a Prisma migration (`pnpm db:migrate:dev`).
4. CI must pass before merging.
