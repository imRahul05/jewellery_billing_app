"use client";

import React from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { RevealUp } from "./motion-primitives";

export function HeroSection() {
  return (
    <section className="relative min-h-[96vh] flex flex-col justify-between pt-28 sm:pt-36 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* 1. Top Editorial Hierarchy */}
      <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
        {/* Small Eyebrow */}
        <RevealUp delay={0.06} direction="down">
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-stone-500 dark:text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#deb862]" />
            <span>Sovereign Financial Infrastructure · Precious Metals</span>
          </div>
        </RevealUp>

        {/* Large Headline */}
        <RevealUp delay={0.14} duration={1.1}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.75rem] xl:text-[6.5rem] font-light tracking-[-0.04em] text-stone-950 dark:text-stone-100 max-w-5xl leading-[1.02]">
            Pure Metallurgy.{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862] block sm:inline">
              Mathematical Precision.
            </span>
          </h1>
        </RevealUp>

        {/* Concise Supporting Copy */}
        <RevealUp delay={0.24} duration={0.9}>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300/80 max-w-2xl font-light leading-relaxed">
            The next-generation multi-tenant ERP engineered for high-volume bullion
            desks, jewellery ateliers, and retail empires. Sub-milligram accuracy meets
            concurrency-safe GST invoicing.
          </p>
        </RevealUp>

        {/* Single Confident Primary CTA */}
        <RevealUp delay={0.34} direction="up">
          <div className="pt-2">
            <a
              href="#demo-portal"
              className="group inline-flex items-center gap-3 px-8 py-3.5 sm:py-4 rounded-md bg-[#deb862] hover:bg-[#e6ca85] text-[#07080b] font-semibold text-xs uppercase tracking-[0.16em] transition-all duration-300 shadow-sm hover:shadow-[0_0_28px_rgba(222,184,98,0.22)] cursor-pointer"
            >
              <span>Enter Sovereign Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </RevealUp>
      </div>

      {/* 2. Dedicated Negative Space Stage Area for 3D Ingot */}
      <div
        className="w-full h-[220px] sm:h-[300px] md:h-[340px] pointer-events-none relative flex items-center justify-center my-4"
        aria-hidden="true"
      />

      {/* 3. One Quiet Typography-Led Supporting Data Layer */}
      <RevealUp delay={0.46} direction="up">
        <div className="border-t border-stone-200/80 dark:border-white/[0.08] pt-8 sm:pt-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6 text-center md:text-left">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light font-mono text-stone-900 dark:text-stone-100 tracking-tight tnums">
                0.001<span className="text-sm font-sans text-amber-700 dark:text-[#deb862] ml-1">g</span>
              </div>
              <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 uppercase font-mono tracking-wider">
                Milligram-scale precision
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light font-mono text-stone-900 dark:text-stone-100 tracking-tight tnums">
                &lt; 1<span className="text-sm font-sans text-amber-700 dark:text-[#deb862] ml-1">ms</span>
              </div>
              <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 uppercase font-mono tracking-wider">
                Live bullion valuation
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light font-mono text-stone-900 dark:text-stone-100 tracking-tight tnums">
                100<span className="text-sm font-sans text-amber-700 dark:text-[#deb862] ml-1">%</span>
              </div>
              <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 uppercase font-mono tracking-wider">
                BIS hallmark verification
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light font-mono text-stone-900 dark:text-stone-100 tracking-tight">
                Zero<span className="text-sm font-sans text-amber-700 dark:text-[#deb862] ml-1">drift</span>
              </div>
              <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 uppercase font-mono tracking-wider">
                Row-level tenant isolation
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Scroll Cue */}
        <div className="flex flex-col items-center justify-center mt-10 text-stone-400 dark:text-stone-500">
          <span className="text-[10px] uppercase font-mono tracking-[0.24em] mb-1.5 text-stone-400 dark:text-stone-500">
            Scroll to inspect
          </span>
          <ArrowDown className="w-3.5 h-3.5 text-amber-700 dark:text-[#deb862]" />
        </div>
      </RevealUp>
    </section>
  );
}

