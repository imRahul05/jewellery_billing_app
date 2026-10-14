# Phase 0: Reference & Technical Discovery

## 1. Domain & Conceptual Inspiration
- **Domain:** Enterprise Multi-Tenant Jewellery ERP, Bullion Trading, and Sovereign Retail Billing.
- **Reference Experiences Analyzed:**
  - *Apple Pro Product Narrative:* Pinned scroll choreographies, macro product zooms, light glints across chamfered metal edges.
  - *Cartier / Audemars Piguet Haute Joaillerie:* Deep obsidian backgrounds, warm 24K gold luster, micro-mechanical precision, restrained editorial serif accents paired with monospaced precision telemetry.
  - *Linear / Stripe Press:* Crisp interactive typography, synchronized scroll scrubbers, real-time reactive metrics, high-contrast dark mode aesthetics.
- **Core Design Language Extracted:**
  - *Dualism:* Ancient timeless metallurgy (Gold, Silver, Platinum, Diamonds) meeting uncompromising modern mathematical computing (Decimal precision, HUID cryptography, Concurrency-safe invoicing).
  - *Motion Pacing:* Smooth, weighted deceleration (inertia-driven feel), zero jump cuts, continuous camera choreography over 3D bullion and diamond facets.

## 2. Existing Repository State
- **Repository:** `jewellery_billing_app`
- **Application Directory:** `jewellery-erp/`
- **Framework & Libraries:**
  - **Framework:** Next.js 16.2.9 (App Router)
  - **UI Runtime:** React 19.2.7
  - **Styling:** Tailwind CSS v4 (`@import "tailwindcss";`), shadcn/ui
  - **Graphics & Motion:** Three.js v0.186, GSAP v3.15.0 + ScrollTrigger
  - **Database & Auth:** Prisma 7.8.0, Neon Serverless PostgreSQL, Neon Auth
  - **State Management:** Zustand 5.0.14, TanStack React Query 5.101.2
- **Current Entry Point:** `jewellery-erp/app/page.tsx` previously redirected to `/dashboard`. We are turning the root route (`/`) into the sovereign cinematic landing experience, with seamless zero-friction pathways to the `/login` and demo login actions.

## 3. Available Assets & Procedural Strategy
- **3D Assets Strategy:** Rather than relying on multi-megabyte external GLB files that introduce network latency, load failures, or blocking spinners, we implement a **Procedural Luxury 3D Mesh & Shader Architecture**:
  1. *The 24K Bullion Monolith:* Precision beveled gold ingot geometry with physical anisotropic brushed metal reflections, specular falloff, and stamped hallmark engravings.
  2. *The Brilliant Diamond:* Octahedral faceted refractive diamond geometry with dispersion refraction, chromatic aberration highlights, and caustic sparkle.
  3. *The Kinetic Vault Ring:* Concentric calibrated brass & titanium gear rings demonstrating milligram balance and concurrency locking.
- **2D / Iconographic Assets:** Lucide React icons, high-definition SVG hallmarks, dynamic SVG ledger grids.

## 4. Technical Constraints & Architecture Rules
- **React 19 & Next.js 16 Compatibility:** Three.js and GSAP must mount inside client components with robust SSR hydration isolation (`use client`, dynamic imports with `ssr: false` or `useEffect` mount verification).
- **Strict Type Safety:**
  - Absolutely **NO `any`** and **NO `unknown`** in any TypeScript files.
  - All props, animation refs, WebGL scene states, and scroll callbacks must use explicit strict interfaces.
- **Zero Lint Errors:** Clean, declarative TypeScript with strict compiler options.
- **Performance Targets:**
  - Solid 60fps WebGL rendering via RAF throttled to viewport visibility.
  - Pixel ratio capped at `Math.min(window.devicePixelRatio, 2)` to protect GPU bandwidth.
  - Full support for `prefers-reduced-motion: reduce`.
  - Responsive layout and motion degradation for Mobile / Tablet viewports.
