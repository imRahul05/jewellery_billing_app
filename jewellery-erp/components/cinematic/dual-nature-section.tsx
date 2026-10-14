"use client";

import React, { useState } from "react";
import { Scale, Database, ChevronRight } from "lucide-react";
import { LIVE_METAL_RATES } from "@/lib/cinematic/calculation-engine";
import { RevealUp } from "./motion-primitives";

type PurityKey = "gold24k" | "gold22k" | "gold18k" | "gold14k";

export function DualNatureSection() {
  const [selectedPurity, setSelectedPurity] = useState<PurityKey>("gold22k");

  const activeData = LIVE_METAL_RATES[selectedPurity];

  const purityDescriptions: Record<
    PurityKey,
    { alloy: string; useCase: string; bisMark: string }
  > = {
    gold24k: {
      alloy: "99.9% Fine Gold — Unalloyed Sovereign Bullion",
      useCase: "Investment bars, institutional trading, minted coins",
      bisMark: "999",
    },
    gold22k: {
      alloy: "91.6% Pure Gold + 8.4% Copper/Silver for structural rigidity",
      useCase: "Traditional bridal wear, temple jewellery, heavy chains",
      bisMark: "916",
    },
    gold18k: {
      alloy: "75.0% Fine Gold + 25.0% Fine Silver/Palladium",
      useCase: "Diamond studded solitaires, fine pave settings, haute joaillerie",
      bisMark: "750",
    },
    gold14k: {
      alloy: "58.5% Fine Gold + 41.5% Custom Alloys",
      useCase: "Modern lightweight daily wear, office wear collections",
      bisMark: "585",
    },
  };

  return (
    <section id="science" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <RevealUp>
          <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.24em] text-stone-500 dark:text-stone-400">
            Act II · The Dual Precision
          </span>
        </RevealUp>
        <RevealUp delay={0.12}>
          <h2 className="text-3xl sm:text-5xl font-normal text-stone-950 dark:text-white tracking-[-0.025em] leading-tight">
            Where Ancient Metallurgy Meets{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862]">
              Cloud Concurrency
            </span>
          </h2>
        </RevealUp>
        <RevealUp delay={0.22}>
          <p className="text-base text-stone-600 dark:text-stone-300/80 font-light leading-relaxed pt-1">
            In fine jewellery, a tenth of a gram carries thousands of rupees. A single
            rounding discrepancy breaks trust with customers and auditors. AURA ERP
            binds physical scale telemetry to immutable database ledgers with zero drift.
          </p>
        </RevealUp>
      </div>

      {/* Sleek Segmented Purity Selector */}
      <RevealUp delay={0.3} className="mb-14">
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-lg bg-stone-200/60 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08]">
            {(["gold24k", "gold22k", "gold18k", "gold14k"] as PurityKey[]).map((key) => {
              const entry = LIVE_METAL_RATES[key];
              const isSelected = selectedPurity === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPurity(key)}
                  className={`px-4 sm:px-6 py-2 rounded-md text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-[#12151c] text-stone-950 dark:text-[#deb862] font-semibold shadow-sm border border-stone-200/80 dark:border-white/[0.1]"
                      : "text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  <span>{entry.karat}</span>
                  <span className="opacity-70 ml-1.5 hidden sm:inline">({entry.purity})</span>
                </button>
              );
            })}
          </div>
        </div>
      </RevealUp>

      {/* Dual Architectural Specification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: Metallurgy & Physical Calibration */}
        <RevealUp delay={0.4} direction="left">
          <div className="bg-stone-100/70 dark:bg-[#07080b]/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-stone-200/80 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.14] transition-all duration-300 flex flex-col justify-between h-full shadow-sm dark:shadow-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] flex items-center justify-center text-amber-700 dark:text-[#deb862]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 block">
                      Physical Metallurgy
                    </span>
                    <h3 className="text-base sm:text-lg font-medium text-stone-950 dark:text-stone-100">
                      Sub-Milligram Calibration
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-amber-700 dark:text-[#deb862] px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                  BIS {purityDescriptions[selectedPurity].bisMark}
                </span>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300/80 font-light leading-relaxed">
                {purityDescriptions[selectedPurity].alloy}
              </p>

              {/* Data Specifications Table */}
              <div className="space-y-3 font-mono text-xs pt-2">
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">Benchmark Karat:</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    {activeData.karat} ({activeData.purity})
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">BIS Hallmark Standard:</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    6-Digit HUID Traceable
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">Live Valuation Baseline:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold tnums">
                    ₹{activeData.ratePerGram.toFixed(2)} / gram
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
              <span>Application Focus:</span>
              <span className="text-stone-900 dark:text-stone-200 font-sans font-normal text-right max-w-[240px]">
                {purityDescriptions[selectedPurity].useCase}
              </span>
            </div>
          </div>
        </RevealUp>

        {/* Right: Digital Concurrency & ACID Integrity */}
        <RevealUp delay={0.5} direction="right">
          <div className="bg-stone-100/70 dark:bg-[#07080b]/80 backdrop-blur-xl p-8 sm:p-10 rounded-2xl border border-stone-200/80 dark:border-white/[0.08] hover:border-stone-300 dark:hover:border-white/[0.14] transition-all duration-300 flex flex-col justify-between h-full shadow-sm dark:shadow-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] flex items-center justify-center text-stone-700 dark:text-stone-300">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400 block">
                      Mathematical Integrity
                    </span>
                    <h3 className="text-base sm:text-lg font-medium text-stone-950 dark:text-stone-100">
                      Concurrency-Safe Ledgers
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded bg-stone-100 dark:bg-white/[0.05] border border-stone-200 dark:border-white/[0.08]">
                  ACID
                </span>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300/80 font-light leading-relaxed">
                Zero rounding drift. All weights computed to three decimal places (0.001g),
                and financial totals rounded strictly per Section 170 of the CGST Act.
              </p>

              {/* Data Specifications Table */}
              <div className="space-y-3 font-mono text-xs pt-2">
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">Rate Snapshot Lock:</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    Point-in-Time Immutable
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">Weight Decimal Precision:</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    DECIMAL(10, 3) Milligrams
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100 dark:border-white/[0.04]">
                  <span className="text-stone-500 dark:text-stone-400">Invoice Numbering:</span>
                  <span className="text-stone-900 dark:text-stone-200 font-medium">
                    Atomic Non-Skipping Sequence
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
              <span>Database Engine:</span>
              <span className="text-stone-900 dark:text-stone-200 flex items-center gap-1 font-medium">
                Neon Serverless PostgreSQL <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </RevealUp>
      </div>
    </section>
  );
}
