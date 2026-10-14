# Phase 1: Motion Specification

This document provides the section-by-section choreographic specification for the Jewellery ERP Cinematic Web Experience.

---

## SECTION 1: HERO / THE GOLDEN MONOLITH (Act I)

- **Purpose:** Establish sovereign authority, ultra-luxury aesthetic, and the marriage of fine gold craftsmanship with enterprise cloud computing.
- **Visual hierarchy:** Primary (3D Gold Bullion Bar & Hero Headline), Secondary (Value proposition badge & live ticker), Tertiary (CTA buttons & scroll indicator).
- **Static elements:** Navigation container framework, root background gradients.
- **Animated DOM elements:** Badge tag ("SOVEREIGN JEWELLERY COMPUTING"), headline lines, sub-copy paragraph, CTA cluster ("Launch Live Demo" & "Explore Architecture"), live 24K bullion ticker.
- **Parallax layers:**
  - Background grid / nebula: `speed = 0.05`
  - 3D WebGL Canvas: `speed = 0.20`
  - Typography content block: `speed = 0.15`
  - Floating market metrics badge: `speed = 0.28`
- **Scroll behavior:** Natural scroll progression scrubs 3D bullion rotation; headline gently recedes into depth with opacity fade and upward translation.
- **Pinned elements:** Hero stage is pinned for 1.2 viewport heights during initial camera orbit before releasing into the narrative track.
- **3D elements:** 24K Gold Ingot with stamped hallmark, directional key light with anisotropic reflection glint, floating ambient dust motes.
- **GSAP responsibility:** Timeline scrubbing, SplitText-style staggered line reveal on initial load, ScrollTrigger pin & camera property interpolations.
- **Three.js responsibility:** PBR metallic-roughness material shader, mesh rotation on Y/X axes, spot light position glint pass, camera subtle dolly.
- **Entry:** On page load, bullion emerges from depth with warm specular flare while headline words slide up from clip path (`power3.out`, 1.2s).
- **Middle:** As user scrolls, bullion tilts 35 degrees clockwise toward camera, highlighting laser hallmark stamping "999.9 FINE GOLD".
- **Exit:** Bullion scales down and glides toward the right quadrant as Section 2 content glides in from the left.
- **Desktop behavior:** Full 60fps WebGL with anisotropic reflection, 3D glint, and depth of field.
- **Tablet behavior:** Reduced camera travel, simplified post-effects.
- **Mobile behavior:** Bullion rendered at fixed optimized perspective; touch scroll scrubs rotation without aggressive camera dolly.
- **Reduced-motion behavior:** Bullion renders static angled beauty shot; DOM elements appear with instantaneous fade (0.2s opacity only), no pin scrub.
- **Performance considerations:** Render loop tied to RAF; paused if scrolled completely past hero viewport.

---

## SECTION 2: THE DUAL NATURE — METALLURGY & MATHEMATICS (Act II)

- **Purpose:** Demonstrate the dual requirement of jewellery ERP: physical material accuracy (0.001g) and financial compliance (GST, TDS, ledger balance).
- **Visual hierarchy:** Primary (Interactive comparison dial & real-time metric counter), Secondary (Editorial narrative copy), Tertiary (Purity badges 24K/22K/18K/14K).
- **Static elements:** Section boundary container, subtle divider line.
- **Animated DOM elements:** Section category eyebrow, title text, dual metric cards ("Physical Purity" vs. "Cloud Concurrency"), interactive purity toggle pills.
- **Parallax layers:**
  - Background radial aura: `speed = 0.08`
  - 3D Diamond / Ingot facet transition: `speed = 0.18`
  - Metric cards: `speed = 0.25`
- **Scroll behavior:** Scrubbing rotates 3D scene from solid gold bar to brilliant-cut diamond geometry with prismatic light refraction.
- **Pinned elements:** Center stage pinned for 1.0 viewport height while cards alternate focus.
- **3D elements:** Procedural Brilliant-Cut Diamond mesh with multi-pass refraction and chromatic aberration facets.
- **GSAP responsibility:** Card stagger reveal, metric numbers counting up from 0 to 99.99% and 0.001g, ScrollTrigger scrub synchronization.
- **Three.js responsibility:** Diamond rotation around Y axis, index of refraction (IOR) material update on purity toggle.
- **Entry:** Left card slides in from X: -60px, Right card from X: +60px, fading from opacity 0 to 1 (`power2.out`).
- **Middle:** Cards reach full alignment; interactive hover or scroll highlights the live active metric.
- **Exit:** Cards translate upward (`y: -80px`) and fade to 0.2 opacity as Section 3 approaches.
- **Desktop behavior:** Complete dual-column split with centered 3D diamond refraction.
- **Tablet behavior:** Stacked cards with diamond positioned above text.
- **Mobile behavior:** Compact card carousel layout, simplified diamond rendering.
- **Reduced-motion behavior:** Static cards, no translation, numbers load already completed.
- **Performance considerations:** Diamond geometry optimized to low polygon count with custom normal shading.

---

## SECTION 3: THE HIGH-FREQUENCY BILLING SIMULATOR (Act III)

- **Purpose:** Put the user in control of an interactive jewellery invoice calculation demonstrating instant GST, making charges, and old gold exchange.
- **Visual hierarchy:** Primary (Interactive billing calculator terminal), Secondary (Live breakdown receipt), Tertiary (Hallmark verification badge).
- **Static elements:** Calculator outer casing, input field labels.
- **Animated DOM elements:** Live weight slider, metal rate selector, dynamic tax recalculation rows, generated invoice total display, instant QR code seal.
- **Parallax layers:**
  - Terminal container: `speed = 0.12`
  - Verification badge: `speed = 0.22`
- **Scroll behavior:** Enters pinned view where interactive sliders can be manipulated or scrubbed.
- **Pinned elements:** Billing console stays sticky during breakdown progression.
- **3D elements:** Ambient golden particles rising behind the console representing transaction streams.
- **GSAP responsibility:** Smooth interpolation of tally numbers, pulse animation on total price recalculation.
- **Three.js responsibility:** Particle system flow with vertex noise.
- **Entry:** Console scales from 0.95 to 1.0 with subtle glow expansion.
- **Middle:** Interactive state allows user to change weight (e.g., 10.500g) and watch making charges & 3% GST re-compute in 0ms.
- **Exit:** Console lifts upward seamlessly dissolving into the enterprise architecture grid.
- **Desktop behavior:** Side-by-side terminal: inputs on left, real-time GST thermal invoice preview on right.
- **Tablet behavior:** Stacked inputs with receipt below.
- **Mobile behavior:** Simplified slider control with collapsible breakdown.
- **Reduced-motion behavior:** Instantaneous number changes without bounce or scale transitions.
- **Performance considerations:** Calculation executed via pure client-side math; zero network latency.

---

## SECTION 4: ENTERPRISE LEDGER & MULTI-TENANT VAULT (Act IV)

- **Purpose:** Present the underlying enterprise security: Neon Serverless Postgres, tenant isolation, and cryptographic audit logs.
- **Visual hierarchy:** Primary (Interactive 3D Vault Ring / Security Engine), Secondary (Feature pillars: RBAC, Audit, Branch Sync), Tertiary (Architecture telemetry tags).
- **Static elements:** Section header and container frame.
- **Animated DOM elements:** 3 Security feature pillars, animated SVG pulse connecting nodes, live audit log preview strip.
- **Parallax layers:**
  - Security grid background: `speed = 0.06`
  - 3D Vault Ring: `speed = 0.20`
  - Feature cards: `speed = 0.24`
- **Scroll behavior:** User scroll drives kinetic rotation of concentric vault lock rings, locking securely into place as each feature activates.
- **Pinned elements:** Central vault ring pinned during rotation cycle.
- **3D elements:** Concentric precision brass & titanium gear rings with interlocking teeth.
- **GSAP responsibility:** Coordinate rotation angles of inner, middle, and outer rings to scroll progress [0.0 -> 0.33 -> 0.66 -> 1.0].
- **Three.js responsibility:** Mesh rotation, specular highlight shifts along chamfered edges.
- **Entry:** Rings emerge along Z-axis toward camera.
- **Middle:** Rings spin at varying differential ratios, aligning key notches at scroll milestones.
- **Exit:** Rings lock in place with a sharp metallic gleam, transitioning into the transformation metrics.
- **Desktop behavior:** 3D vault rings centered between interactive architectural pillars.
- **Tablet & Mobile behavior:** Vault rings rendered with reduced geometry, vertical pillar sequence.
- **Reduced-motion behavior:** Rings fixed in locked state, cards statically displayed.
- **Performance considerations:** Caching matrix transformations; instanced mesh where applicable.

---

## SECTION 5: TRANSFORMATION — FRAGMENTED CHAOS TO SOVEREIGN HARMONY (Act V)

- **Purpose:** Dramatic contrast between the old way (lost paper khatas, GST calculation errors, untracked stone weights) and the AURA ERP way (milligram precision, automated GST, real-time bullion valuations).
- **Visual hierarchy:** Primary (Interactive split-screen / toggle comparison), Secondary (Comparative metric points), Tertiary (Evidence citations).
- **Static elements:** Split comparison container.
- **Animated DOM elements:** Comparison slider handle, "Legacy Software" vs. "AURA ERP" state indicators, comparative feature cards.
- **Parallax layers:**
  - Legacy side desaturated backdrop: `speed = 0.10`
  - AURA ERP golden aura backdrop: `speed = 0.20`
- **Scroll behavior:** Pin and scrub transition from chaotic red/monochrome noise into structured, illuminated golden clarity.
- **Pinned elements:** Comparison view pinned for 1.0 viewport height.
- **3D elements:** Ambient dust particles coalesce into structured geometric lattice.
- **GSAP responsibility:** Clip-path reveal synchronization with scroll position and drag controller.
- **Three.js responsibility:** Particle convergence simulation.
- **Entry:** Legacy state visible; as scroll advances, golden demarcation line sweeps across the screen.
- **Middle:** Full split-state exploration available.
- **Exit:** Clean sweep to 100% AURA ERP state, releasing scroll into CTA.
- **Desktop / Tablet / Mobile behavior:** Touch-draggable or scroll-scrubbed divider with full gesture support.
- **Reduced-motion behavior:** Side-by-side comparative column cards without clip-path wipes.
- **Performance considerations:** Pure CSS `clip-path` with GPU acceleration.

---

## SECTION 6: RESOLUTION & DEMO ACCESS GATEWAY (Act VI)

- **Purpose:** Immediate conversion: instant demo login trigger, role selection (Business Owner, Cashier, Inventory Manager), or portal sign-in.
- **Visual hierarchy:** Primary (One-Click Demo Launcher button & Role switcher), Secondary (Feature guarantee checkmarks), Tertiary (Copyright & compliance credits).
- **Static elements:** Background container, footer links.
- **Animated DOM elements:** Radiant pulse on primary CTA, role selector pills, glowing gold border animation around the sandbox launcher.
- **Parallax layers:**
  - Floating background aura: `speed = 0.08`
  - Action card: `speed = 0.14`
- **Scroll behavior:** Decelerates into stable, centered focal point with zero visual distraction.
- **Pinned elements:** None.
- **3D elements:** Slow, majestic 3D gold bullion resting state in background with gentle ambient breathing rotation.
- **GSAP responsibility:** Button magnetic hover effect, glowing border gradient loop.
- **Three.js responsibility:** Ambient idle rotation at 0.002 rad/frame.
- **Entry:** Card rises smoothly (`y: 40px -> 0px`, `opacity: 0 -> 1`).
- **Middle:** Role selector dynamically previews user privileges.
- **Exit:** Seamless client transition upon clicking "Launch Demo" directly into the application.
- **Desktop / Mobile behavior:** Fully responsive, high-contrast tap targets (>48px).
- **Reduced-motion behavior:** No magnetic pull or pulsing; clear, crisp actionable buttons.
- **Performance considerations:** Three.js throttled to minimal rendering cost.
