# Phase 1: 3D WebGL Architecture Specification

## 1. WebGL Pipeline Overview

```
                        THREE.JS STAGE CONTROLLER
                                   │
              ┌────────────────────┼────────────────────┐
              ↓                    ↓                    ↓
       GEOMETRY FACTORY     MATERIAL SYSTEM      LIGHTING & CAMERA
              │                    │                    │
      - 24K Gold Ingot     - High-Gloss PBR     - Key Studio Spot
      - Brilliant Diamond  - Faceted Diamond    - Rim Ambient Blue
      - Vault Gear Rings   - Brushed Titanium   - Subtle Fill Light
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ↓
                         RENDERER & COMPOSITOR
                                   ↓
                           CANVAS CONTAINER
```

---

## 2. Procedural Geometries

1. **The 24K Gold Bullion Ingot:**
   - **Form:** Truncated trapezoidal prism (classic cast ingot taper) with softened bevel edges (`chamferRatio = 0.08`).
   - **Dimensions:** Width: 3.2, Height: 1.2, Depth: 1.6 units.
   - **Engraving Detail:** Laser-etched relief geometry simulating standard 999.9 purity mark, hallmark crest, and weight stamp.

2. **The Brilliant-Cut Diamond:**
   - **Form:** 57-facet standard round brilliant cut approximation using a dual-pyramid faceted polyhedron.
   - **Dimensions:** Diameter: 2.2 units, Total Depth: 1.4 units.
   - **Refraction:** Dynamic refraction index with faceted normal calculations to trigger multi-angle chromatic highlights.

3. **Concentric Kinetic Vault Rings:**
   - **Form:** Three nested cylindrical rings with calibrated gear notches and micro-machined radial tick marks.
   - **Inner Ring:** Diameter 1.8 units, thickness 0.15.
   - **Middle Ring:** Diameter 2.6 units, thickness 0.15.
   - **Outer Ring:** Diameter 3.4 units, thickness 0.18.

---

## 3. Physical Materials (PBR)

- **24K Imperial Gold Material:**
  - `color`: `0xF5C542` (warm high-karat gold)
  - `metalness`: `0.96`
  - `roughness`: `0.18` (subtle satin polish)
  - `envMapIntensity`: `1.8`
  - `clearcoat`: `0.3`
  - `clearcoatRoughness`: `0.1`

- **Brilliant Diamond Material:**
  - `color`: `0xFFFFFF`
  - `transmission`: `0.92`
  - `opacity`: `1.0`
  - `metalness`: `0.02`
  - `roughness`: `0.05`
  - `ior`: `2.417` (physical diamond index of refraction)
  - `dispersion`: `0.044`

- **Machined Titanium Material:**
  - `color`: `0x334155`
  - `metalness`: `0.85`
  - `roughness`: `0.35`
  - `wireframe`: false

---

## 4. Scroll Progress Choreography (0.0 to 1.0)

| Scroll Progress | Active Visual Stage | Camera Position (X, Y, Z) | Target Object Focus | Motion Description |
| :---: | :---: | :---: | :---: | :---: |
| **0.00 – 0.20** | Hero / Act I | `(0, 0.5, 4.5)` | Gold Ingot | Gentle floating yaw rotation, specular glint sweeps from top-left to bottom-right |
| **0.20 – 0.40** | Dual Nature / Act II | `(-1.5, 0.8, 4.0)` | Ingot → Diamond | Ingot rotates and transitions; Diamond rises into focal plane with chromatic dispersion |
| **0.40 – 0.60** | Billing Engine / Act III | `(1.2, 0.2, 3.8)` | Particle Stream | Camera pulls back to ambient space, golden stream of micro-particles flows into billing ledger |
| **0.60 – 0.80** | Vault Ledger / Act IV | `(0, 0, 4.2)` | Concentric Rings | Concentric rings spin differentially: outer (-120°), middle (+240°), inner (-360°), snapping shut |
| **0.80 – 1.00** | Resolution / Act V-VI | `(0, 0.4, 4.8)` | Unified Sovereign Ingot | Gold ingot returns to center stage with stable, ambient breathing rotation |

---

## 5. Performance, Memory & Cleanup Lifecycle

- **Canvas Container:** Rendered with CSS `pointer-events: none` (except for interactive inspectable states) to keep native scrolling 100% fluid.
- **Throttling:** WebGL rendering loop uses `requestAnimationFrame`. If the canvas is not in the active viewport (tracked via `IntersectionObserver`), RAF continues in an idle tick or pauses rendering.
- **Disposal:** On component unmount:
  - Traverses the entire scene graph.
  - Calls `geometry.dispose()` on every geometry.
  - Calls `material.dispose()` and disposes textures.
  - Calls `renderer.dispose()` and removes the WebGL context.
