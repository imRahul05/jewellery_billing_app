# Phase 1: Site Architecture Specification

## 1. System Responsibilities

```
                                  USER SCROLL
                                       ↓
                             SCROLL PROGRESS (0.0 → 1.0)
                                       ↓
                           MASTER MOTION CONTROLLER
                                       ↓
         ┌─────────────────────────────┼─────────────────────────────┐
         ↓                             ↓                             ↓
     DOM & UI LAYER              GSAP ENGINE                  THREE.JS STAGE
  (Next.js 16 / React 19)    (ScrollTrigger / Timelines)      (WebGL Canvas)
         ↓                             ↓                             ↓
  - Semantic HTML5              - Scroll Scrubbing            - 3D Gold Bullion Bar
  - Tailwind CSS v4 styling     - Pinned Viewports            - 3D Diamond Refraction
  - Interactive Calculators     - SplitText Staggers          - 3D Kinetic Vault Ring
  - Accessibility (ARIA)        - Parallax Layers             - Dynamic Lighting
  - Demo Sign-in Integration    - Reduced-Motion Guards       - GPU Memory Disposal
```

### Next.js 16 & React 19 Owns:
- Core page structure, semantic layout (`<header>`, `<main>`, `<section>`, `<footer>`).
- State management for interactive components (live GST calculator, metal purity toggles, before/after slider).
- Server Actions integration (connecting directly to `signInAsDemo` or route navigation to `/login` and `/dashboard`).
- Responsive styling via Tailwind CSS v4 with dark luxury gold & obsidian design tokens.
- SSR hydration isolation and safe dynamic mounting.

### GSAP & ScrollTrigger Owns:
- Master scroll choreography and continuous scrub interpolation.
- Pinned section life-cycle management (locking stages for narrative deep-dives).
- Motion primitives (`reveal-up`, `parallax-layer`, `split-stagger`, `counter-interpolate`).
- Device orientation, resize debouncing, and `ScrollTrigger.refresh()` synchronization.
- Enforcement of `prefers-reduced-motion` to bypass all motion when requested.

### Three.js WebGL Engine Owns:
- WebGL rendering context with automated device-pixel-ratio throttling (max 2.0).
- Procedural luxury geometries:
  1. *24K Gold Bullion Ingot:* High-fidelity beveled mesh with physical metallic-roughness shader.
  2. *Brilliant-Cut Diamond:* Octahedral refraction geometry with faceted chromatic specular highlights.
  3. *Concentric Kinetic Vault Rings:* Calibrated precision brass and titanium gear rings.
- Dynamic key, fill, and rim lighting with simulated caustic ground reflections.
- Scrub-driven 3D camera animations (position, lookAt, FOV) synchronized with scroll progression.
- Context lifecycle: clean WebGL disposal of geometries, materials, and textures on unmount.

---

## 2. Directory Structure

```
jewellery-erp/
├── app/
│   ├── page.tsx                           # Master cinematic landing experience
│   ├── layout.tsx                         # Root layout with theme & font providers
│   └── globals.css                        # Tailwind v4 theme tokens & luxury accents
├── components/
│   └── cinematic/
│       ├── navigation.tsx                 # Fixed sovereign navigation header
│       ├── hero-section.tsx               # Act I: The 24K Golden Monolith
│       ├── dual-nature-section.tsx        # Act II: Metallurgy & Mathematics
│       ├── billing-simulator-section.tsx  # Act III: Interactive Live Billing Engine
│       ├── vault-ledger-section.tsx       # Act IV: Enterprise Security & Multi-Tenancy
│       ├── transformation-section.tsx     # Act V: Before vs. After Interactive Comparison
│       ├── cta-gateway-section.tsx        # Act VI: Instant Demo Sandbox Launcher
│       ├── footer-section.tsx             # Sovereign Footer & Compliance
│       ├── three-stage.tsx                # Client-side 3D WebGL Canvas controller
│       └── motion-primitives.tsx          # Reusable GSAP & ScrollTrigger controllers
├── lib/
│   └── cinematic/
│       ├── types.ts                       # Strict TypeScript interfaces (NO any, NO unknown)
│       ├── three-scene.ts                 # Pure Three.js stage management & shaders
│       └── calculation-engine.ts          # Milligram precision GST & bullion calculator
```

---

## 3. Strict Type Safety Contract
In accordance with system rules:
- **NO `any`** and **NO `unknown`** are permitted anywhere in the codebase.
- Explicit interfaces must govern all 3D mesh references, GSAP timeline contexts, event handlers, and simulation states.
- Clean functional components and declarative hooks only.
