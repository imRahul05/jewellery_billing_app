# Jewellery ERP / Billing App

A modern, multi-tenant Jewellery Enterprise Resource Planning (ERP) and Billing application built for jewelry retail and wholesale businesses.

## 📊 Development Progress

**Overall Completion**: `[█████████░░░░░░]` **60%** (9 / 15 Sprints Completed)

We are following a phased, security-first, vertical-slice implementation strategy. Core infrastructure, multi-tenant isolation, and access controls are fully operational before business features are developed.

### Phase Progress Tracker

| Phase | Milestones | Scope / Key Deliverables | Est. Duration | Progress | Verification & Specs |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Phase 0: Foundations** | **M0** (Platform baseline) | Next.js scaffold, Neon branching config, Prisma init, base layout, theme toggle, currency/weight format utils | 1 Sprint (2 wks) | `[██████████] 100%` | Spec: [base-setup-design](jewellery-erp/docs/superpowers/specs/2026-07-01-jewellery-erp-base-setup-design.md)<br>Audit: [progress-CONTEXT](jewellery-erp/progress-CONTEXT.md) |
| **Phase 1: Core Tenant + Auth + RBAC** | **M1** (Secure multi-tenant shell) | Tenant context propagation, scoped Prisma client extension, Neon Auth, RBAC guards, User invite & roles UI, Vitest isolation tests | 2 Sprints (4 wks) | `[██████████] 100%` | Spec: [tenant-auth-rbac-design](jewellery-erp/docs/superpowers/specs/2026-07-02-phase1-tenant-auth-rbac-design.md)<br>Audit: [phase1-progress](jewellery-erp/phase1-progress.md) |
| **Phase 2: Master Data** | **M2** (Business config)<br>**M3** (Master data complete) | Business profile & settings, branches, metal rate config, Customer/Supplier CRUD, Inventory items & stock control | 3 Sprints (6 wks) | `[██████████] 100%` | Roadmap: [Development Roadmap](jewellery-saas-docs/docs/11-Development-Roadmap.md#phase-2--master-data-customers--suppliers--inventory-3-sprints--6-weeks)<br>Spec: [Inventory Management](jewellery-saas-docs/docs/10-Inventory-Management.md)<br>Tests: [phase2.test.ts](jewellery-erp/tests/phase2.test.ts) |
| **Phase 3: Billing Engine + GST** | **M4** (First GST invoice)<br>**M5** (Invoice delivery) | Invoice builder, metal rate snapshot, concurrency-safe numbering, CGST/SGST/IGST calculation, payment capture, PDF templates, R2 storage | 3 Sprints (6 wks) | `[██████████] 100%` | Roadmap: [Development Roadmap](jewellery-saas-docs/docs/11-Development-Roadmap.md#phase-3--billing-engine--gst-3-sprints--6-weeks--core-value)<br>Spec: [Billing Engine](jewellery-saas-docs/docs/09-Billing-Engine.md) |
| **Phase 4: Reports & Analytics** | **M6** (Insight layer) | Operational & financial reports (sales, GST period, inventory), dashboard KPI summaries, Recharts integration | 2 Sprints (4 wks) | `[░░░░░░░░░░] 0%` | Roadmap: [Development Roadmap](jewellery-saas-docs/docs/11-Development-Roadmap.md#phase-4--reports--dashboard-analytics-2-sprints--4-weeks) |
| **Phase 5: Ops & Administration** | **M7** (Ops & admin layer) | Immutable audit logs, Super Admin console (suspension, audited impersonation), subscriptions/plans management, notification framework | 2 Sprints (4 wks) | `[░░░░░░░░░░] 0%` | Roadmap: [Development Roadmap](jewellery-saas-docs/docs/11-Development-Roadmap.md#phase-5--notifications--audit--super-admin-2-sprints--4-weeks) |
| **Phase 6: Hardening & Launch** | **M8** (GA-ready) | Security audits, connection ceiling load-tests, UAT regression testing, beta tenant launch, GA checklist signoff | 2 Sprints (4 wks) | `[░░░░░░░░░░] 0%` | Roadmap: [Development Roadmap](jewellery-saas-docs/docs/11-Development-Roadmap.md#phase-6--hardening--launch-2-sprints--4-weeks) |

---

## Features

- **Multi-Tenant Architecture**: Supports multiple isolated organizations with a shared database schema.
- **Invoice & Billing Management**: Create sales, purchase, quotation, estimate, return, exchange, and repair invoices.
- **Inventory & Stock Management**: Track stock movements (purchase in, sale out, adjustments, transfers, returns).
- **Metal Management**: Handle various metal types including gold, silver, platinum, diamond, and others.
- **Payment Processing**: Multi-modal payments supporting cash, card, UPI, bank transfer, cheque, store credit, and gold exchange.
- **High-Precision Calculations**: Supports high-precision decimal calculations for money, weight (up to 3 decimal places), and purity rates.

## Tech Stack

This project is built using modern web development tools and frameworks:

- **Framework**: [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Database ORM**: [Prisma 7](https://www.prisma.io)
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech/)) with serverless drivers (`@prisma/adapter-neon`).
- **Authentication**: Neon Auth
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Client State) + [React Query v5](https://tanstack.com/query/latest) (Server State)
- **Form Handling**: [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for validation
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI, Lucide Icons)

## Architecture Diagrams

### System Architecture

```mermaid
graph TD
    Client[Client / Browser]
    
    subgraph Next.js App Router [Next.js 16 Workspace]
        UI[React Components <br/> TailwindCSS, shadcn/ui]
        State[State Management <br/> Zustand, React Query]
        Actions[Server Actions <br/> API Routes]
        
        Client --> UI
        UI <--> State
        State <--> Actions
    end
    
    subgraph Backend Services
        Prisma[Prisma ORM <br/> @prisma/adapter-neon]
        NeonAuth[Neon Auth]
        
        Actions <--> Prisma
        Actions <--> NeonAuth
    end
    
    subgraph Database
        NeonDB[(Neon Serverless <br/> PostgreSQL)]
        Prisma <--> NeonDB
    end
```

### Core Domain Model (Simplified)

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : has
    ORGANIZATION ||--o{ INVOICE : creates
    ORGANIZATION ||--o{ STOCK_ITEM : manages
    INVOICE ||--|{ INVOICE_LINE : contains
    INVOICE ||--o{ PAYMENT : receives
    STOCK_ITEM ||--o{ STOCK_MOVEMENT : tracks
    STOCK_ITEM }|--|| METAL : "made of"
    CUSTOMER ||--o{ INVOICE : "billed to"
    ORGANIZATION ||--o{ CUSTOMER : has
```

## Getting Started

### Prerequisites

- Node.js (v20+)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jewellery_billing_app
   ```

2. **Install dependencies**
   Navigate to the `jewellery-erp` directory and install packages:
   ```bash
   cd jewellery-erp
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the `jewellery-erp` directory. Ensure you add your Neon Database connection string.
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   # Add other required variables for Neon Auth, etc.
   ```

4. **Database Migrations & Seeding**
   Generate Prisma client, deploy migrations, and run seed script:
   ```bash
   npm run db:generate
   npm run db:migrate:dev
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `jewellery-erp/` - Main Next.js application workspace
  - `app/` - Next.js App Router pages and API routes
  - `components/` - Reusable React components (shadcn ui, custom UI)
  - `lib/` - Utility functions, API clients, auth helpers, and DB configuration
  - `prisma/` - Database schema (`schema.prisma`), migrations, and seed scripts
  - `hooks/` - Custom React hooks

## License

This project is private and proprietary.
