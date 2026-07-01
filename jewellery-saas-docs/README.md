# Jewellery ERP SaaS Platform — Engineering Documentation

> Single source of truth for a production-grade, cloud-native, multi-tenant Jewellery ERP SaaS platform built for Indian jewellery businesses.

## Executive Summary

This repository contains the complete engineering specification for a **multi-tenant SaaS platform** that enables Indian jewellery businesses to manage billing, inventory, customers, suppliers, reports, employees, and settings through a modern web-first architecture. One SaaS instance serves thousands of tenants with fully isolated data. A Super Admin manages all tenants centrally.

Phase 1 targets the **Next.js web platform** only. Secure APIs are designed for future Android/other clients, but their implementation is out of scope.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, TanStack Query, Zod |
| Backend | Next.js Route Handlers + Server Actions (single repo, no separate API server) |
| Auth | Neon Auth |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Deployment | Vercel |
| Storage | Cloudflare R2 |
| Charts | Recharts |
| Printing | PDF generation (thermal printer support future) |

## Architecture Principles

- **Single repository** — one Next.js project. No NestJS, Express, or separate API server.
- **Multi-tenant from day one** — shared PostgreSQL, tenant-aware application logic, complete data isolation.
- **RBAC** — permission-based authorization, not hardcoded role permissions.
- **Production-ready** — security, observability, scalability, and maintainability designed in.

## User Types

Super Admin · Business Owner · Manager · Cashier · Inventory Manager · Accountant

## Documentation Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Product Requirements Document](docs/01-Product-Requirements-Document.md) | Vision, scope, actors, modules, acceptance criteria |
| 02 | [System Architecture](docs/02-System-Architecture.md) | High-level architecture, data flow, integrations |
| 03 | [Database Design](docs/03-Database-Design.md) | Entities, relationships, constraints, indexes, migrations |
| 04 | [Authentication & Security](docs/04-Authentication-Security.md) | Neon Auth, sessions, threat model, hardening |
| 05 | [Multi-Tenancy](docs/05-Multi-Tenancy.md) | Tenant lifecycle, isolation, subscriptions, feature flags |
| 06 | [RBAC & Permissions](docs/06-RBAC-Permissions.md) | Roles, permissions, inheritance, access control |
| 07 | [Frontend Specification](docs/07-Frontend-Specification.md) | Pages, components, states, responsive behavior |
| 08 | [Backend & API Specification](docs/08-Backend-API-Specification.md) | Route handlers, server actions, endpoint contracts |
| 09 | [Billing Engine](docs/09-Billing-Engine.md) | GST invoices, jewellery calculations, lifecycle |
| 10 | [Inventory Management](docs/10-Inventory-Management.md) | Product lifecycle, weight-based stock, audits |
| 11 | [Development Roadmap](docs/11-Development-Roadmap.md) | Phased delivery plan, milestones |
| 12 | [Coding Standards](docs/12-Coding-Standards.md) | Conventions, patterns, testing, review |

## Repository Structure

```
jewellery-saas-docs/
├── README.md
├── docs/
│   ├── 01-Product-Requirements-Document.md
│   ├── 02-System-Architecture.md
│   ├── 03-Database-Design.md
│   ├── 04-Authentication-Security.md
│   ├── 05-Multi-Tenancy.md
│   ├── 06-RBAC-Permissions.md
│   ├── 07-Frontend-Specification.md
│   ├── 08-Backend-API-Specification.md
│   ├── 09-Billing-Engine.md
│   ├── 10-Inventory-Management.md
│   ├── 11-Development-Roadmap.md
│   └── 12-Coding-Standards.md
└── diagrams/
```

## Out of Scope (Phase 1)

Android implementation · AI features · Tally/accounting integrations · Payment gateway implementation · Manufacturing module
