"use client";

import React from "react";
import { RevealUp } from "./motion-primitives";

export function TransformationSection() {
  const comparisons = [
    {
      metric: "Stock Reconciliation",
      legacy: "4 hours every evening manually weighing trays and cross-checking paper khatas.",
      aura: "Continuous sub-milligram auto-reconciliation across all vaults, branches, and trays.",
      advantage: "100% Real-Time",
    },
    {
      metric: "GST & HUID Compliance",
      legacy: "Disjointed spreadsheets, manual CGST/SGST calculations, risking audit penalties.",
      aura: "Instantaneous 3% GST calculation with automatic BIS 6-digit HUID cryptographic sealing.",
      advantage: "Zero Penalty Risk",
    },
    {
      metric: "Old Gold Exchange Tracking",
      legacy: "Ad-hoc scrap appraisals, missing melting loss records, untracked pure gold delta.",
      aura: "Full purity conversion ledger with explicit gross/net melt snapshot and voucher generation.",
      advantage: "Audit-Grade Traceability",
    },
    {
      metric: "Weight Drift & Profit Leakage",
      legacy: "Rough 2-decimal rounding causing up to ₹3.5 Lakhs in annual unmonitored metal drift.",
      aura: "Strict 3-decimal (0.001g) database precision preserving every milligram of margin.",
      advantage: "Zero Margin Leakage",
    },
  ];

  return (
    <section id="transformation" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <RevealUp>
          <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.24em] text-stone-500 dark:text-stone-400">
            Act V · The Sovereign Shift
          </span>
        </RevealUp>
        <RevealUp delay={0.12}>
          <h2 className="text-3xl sm:text-5xl font-normal text-stone-950 dark:text-white tracking-[-0.025em] leading-tight">
            From Fragmented Khatas to{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862]">
              Synchronized ERP
            </span>
          </h2>
        </RevealUp>
        <RevealUp delay={0.22}>
          <p className="text-base text-stone-600 dark:text-stone-300/80 font-light leading-relaxed pt-1">
            See how the transition from legacy desktop billing to cloud-native AURA ERP
            permanently eliminates operational bottlenecks and protects profit margins.
          </p>
        </RevealUp>
      </div>

      {/* Executive Comparison Ledger with Protective Frosted Chassis */}
      <RevealUp delay={0.32}>
        <div className="max-w-6xl mx-auto bg-stone-100/70 dark:bg-[#07080b]/85 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-white/[0.08] p-6 sm:p-10 divide-y divide-stone-200/70 dark:divide-white/[0.07] shadow-sm dark:shadow-none">
          {comparisons.map((item, index) => (
            <div
              key={item.metric}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start ${
                index === 0 ? "pb-8 sm:pb-10" : index === comparisons.length - 1 ? "pt-8 sm:pt-10" : "py-8 sm:py-10"
              }`}
            >
              {/* Domain & Advantage Tag (4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 block">
                  Matrix 0{index + 1}
                </span>
                <h3 className="text-lg font-medium text-stone-950 dark:text-stone-100">
                  {item.metric}
                </h3>
                <span className="inline-block text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {item.advantage}
                </span>
              </div>

              {/* Legacy vs Aura Side-by-Side (8 cols) */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Legacy Method */}
                <div className="space-y-2 p-5 rounded-xl bg-stone-200/40 dark:bg-white/[0.03] border border-stone-300/50 dark:border-white/[0.05]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 block font-medium">
                    Legacy Khata / Spreadsheets
                  </span>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-light">
                    {item.legacy}
                  </p>
                </div>

                {/* Aura ERP Methodology */}
                <div className="space-y-2 p-5 rounded-xl bg-amber-500/[0.06] dark:bg-[#deb862]/[0.05] border border-amber-500/20 dark:border-[#deb862]/20">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-[#deb862] block font-medium">
                    AURA Sovereign Architecture
                  </span>
                  <p className="text-xs text-stone-900 dark:text-stone-200 leading-relaxed font-normal">
                    {item.aura}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </RevealUp>
    </section>
  );
}

