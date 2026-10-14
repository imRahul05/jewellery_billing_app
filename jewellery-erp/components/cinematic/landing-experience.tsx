"use client";

import React, { useState, useEffect } from "react";
import { CinematicNavigation } from "./navigation";
import { ThreeStage } from "./three-stage";
import { HeroSection } from "./hero-section";
import { DualNatureSection } from "./dual-nature-section";
import { BillingSimulatorSection } from "./billing-simulator-section";
import { VaultLedgerSection } from "./vault-ledger-section";
import { TransformationSection } from "./transformation-section";
import { CtaGatewaySection } from "./cta-gateway-section";
import { CinematicFooter } from "./footer-section";

export function CinematicLandingExperience() {
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          const progress =
            docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fbfbf9] text-stone-900 dark:bg-[#060709] dark:text-stone-100 selection:bg-amber-500/20 selection:text-amber-200 overflow-x-hidden font-sans transition-colors duration-300">
      {/* Background Subtle Atmospheric Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(218,184,98,0.03),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(218,184,98,0.04),rgba(6,7,9,0))]"
        aria-hidden="true"
      />

      {/* 3D WebGL Canvas Layer */}
      <ThreeStage scrollProgress={scrollProgress} />

      {/* Sovereign Navigation Bar */}
      <CinematicNavigation />

      {/* Master Narrative Content Track */}
      <main className="relative z-10 flex flex-col space-y-24 sm:space-y-36">
        <HeroSection />
        <DualNatureSection />
        <BillingSimulatorSection />
        <VaultLedgerSection />
        <TransformationSection />
        <CtaGatewaySection />
      </main>

      {/* Footer & Compliance */}
      <CinematicFooter />
    </div>
  );
}
