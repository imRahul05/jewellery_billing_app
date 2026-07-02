# Jewellery ERP / Billing App

A modern, multi-tenant Jewellery Enterprise Resource Planning (ERP) and Billing application built for jewelry retail and wholesale businesses.

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
