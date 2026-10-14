"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  QrCode,
  ShieldCheck,
  Coins,
  ReceiptText,
} from "lucide-react";
import {
  calculateJewelleryInvoice,
  formatInr,
  formatWeight,
  LIVE_METAL_RATES,
} from "@/lib/cinematic/calculation-engine";
import { InvoiceSimulationParams } from "@/lib/cinematic/types";
import { RevealUp } from "./motion-primitives";

export function BillingSimulatorSection() {
  const [params, setParams] = useState<InvoiceSimulationParams>({
    purityKey: "gold22k",
    grossWeightGrams: 16.5,
    stoneWeightGrams: 0.85,
    wastagePercent: 4.0,
    makingChargePerGram: 650,
    oldGoldExchangeValue: 12500,
    customerState: "INTRA_STATE",
  });

  const invoice = useMemo(() => {
    return calculateJewelleryInvoice(params, LIVE_METAL_RATES);
  }, [params]);

  const activeRate = LIVE_METAL_RATES[params.purityKey].ratePerGram;

  return (
    <section id="billing-engine" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <RevealUp>
          <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.24em] text-stone-500 dark:text-stone-400">
            Act III · Live Simulation Terminal
          </span>
        </RevealUp>
        <RevealUp delay={0.12}>
          <h2 className="text-3xl sm:text-5xl font-normal text-stone-950 dark:text-white tracking-[-0.025em] leading-tight">
            The High-Frequency{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862]">
              GST Billing Engine
            </span>
          </h2>
        </RevealUp>
        <RevealUp delay={0.22}>
          <p className="text-base text-stone-600 dark:text-stone-300/80 font-light leading-relaxed pt-1">
            Experience the real-time mathematics that power high-volume bullion desks.
            Adjust weights, wastage allowances, and old gold exchange credits to observe
            instantaneous, zero-drift invoice computation.
          </p>
        </RevealUp>
      </div>

      {/* Simulator Terminal Layout */}
      <RevealUp delay={0.32} duration={1.0}>
        <div className="bg-white/80 dark:bg-[#0a0c10]/90 backdrop-blur-2xl rounded-2xl border border-stone-200/80 dark:border-white/[0.08] p-6 sm:p-10 shadow-sm dark:shadow-none grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Interactive Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/60 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-amber-700 dark:text-[#deb862]" />
                <span className="text-xs uppercase tracking-[0.16em] font-mono font-medium text-stone-900 dark:text-stone-200">
                  Parameter Configuration
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-medium tnums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Rate: ₹{activeRate.toFixed(2)} / g
              </span>
            </div>

            {/* Purity Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400 block">
                1. Metal Purity & Karat Benchmark
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["gold24k", "gold22k", "gold18k", "gold14k"] as const).map((key) => {
                  const item = LIVE_METAL_RATES[key];
                  const isSelected = params.purityKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setParams((prev) => ({ ...prev, purityKey: key }))}
                      className={`py-2 px-3 rounded-md text-xs font-mono text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-stone-900 text-white dark:bg-[#deb862] dark:text-[#08090c] font-semibold shadow-sm"
                          : "bg-stone-100/80 dark:bg-white/[0.04] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/[0.06] hover:border-stone-300 dark:hover:border-white/[0.14]"
                      }`}
                    >
                      {item.karat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gross Weight */}
              <div className="space-y-2.5 bg-stone-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-stone-200/60 dark:border-white/[0.05]">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                    Gross Weight
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 font-semibold tnums">
                    {formatWeight(params.grossWeightGrams)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.05"
                  value={params.grossWeightGrams}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      grossWeightGrams: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full cursor-pointer accent-[#deb862]"
                />
              </div>

              {/* Stone Weight */}
              <div className="space-y-2.5 bg-stone-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-stone-200/60 dark:border-white/[0.05]">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                    Deducted Stones/Enamel
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 font-semibold tnums">
                    {formatWeight(params.stoneWeightGrams)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.05"
                  value={params.stoneWeightGrams}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      stoneWeightGrams: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full cursor-pointer accent-[#deb862]"
                />
              </div>

              {/* Wastage % */}
              <div className="space-y-2.5 bg-stone-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-stone-200/60 dark:border-white/[0.05]">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                    Wastage / Katcha
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 font-semibold tnums">
                    {params.wastagePercent.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={params.wastagePercent}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      wastagePercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full cursor-pointer accent-[#deb862]"
                />
              </div>

              {/* Making Charges */}
              <div className="space-y-2.5 bg-stone-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-stone-200/60 dark:border-white/[0.05]">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px]">
                    Making Charge (per g)
                  </span>
                  <span className="text-stone-900 dark:text-stone-100 font-semibold tnums">
                    ₹{params.makingChargePerGram}
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="25"
                  value={params.makingChargePerGram}
                  onChange={(e) =>
                    setParams((prev) => ({
                      ...prev,
                      makingChargePerGram: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full cursor-pointer accent-[#deb862]"
                />
              </div>
            </div>

            {/* Old Gold Exchange Credit */}
            <div className="bg-stone-50/80 dark:bg-white/[0.02] p-4 rounded-xl border border-stone-200/60 dark:border-white/[0.05] space-y-2.5">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <span className="text-stone-500 dark:text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  Old Gold Scrap Credit
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold tnums">
                  {formatInr(params.oldGoldExchangeValue)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50000"
                step="500"
                value={params.oldGoldExchangeValue}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    oldGoldExchangeValue: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full cursor-pointer accent-[#deb862]"
              />
            </div>

            {/* Tax Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-100/80 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/[0.05] text-xs font-mono">
              <span className="text-stone-500 dark:text-stone-400 text-[11px] uppercase tracking-wider">
                Jurisdiction:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setParams((prev) => ({ ...prev, customerState: "INTRA_STATE" }))
                  }
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    params.customerState === "INTRA_STATE"
                      ? "bg-white dark:bg-[#12151c] text-stone-900 dark:text-[#deb862] border border-stone-200 dark:border-white/[0.1] font-semibold shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  Intra-State (1.5% + 1.5%)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setParams((prev) => ({ ...prev, customerState: "INTER_STATE" }))
                  }
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    params.customerState === "INTER_STATE"
                      ? "bg-white dark:bg-[#12151c] text-stone-900 dark:text-[#deb862] border border-stone-200 dark:border-white/[0.1] font-semibold shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                  }`}
                >
                  Inter-State (3% IGST)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Tax Invoice Confirmation (5 cols) */}
          <div className="lg:col-span-5 bg-[#0a0c10] text-stone-100 rounded-xl border border-stone-800/80 dark:border-white/[0.1] p-6 sm:p-7 flex flex-col justify-between shadow-xl relative">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-stone-400" />
                  <span className="text-xs font-mono font-medium tracking-[0.14em] text-stone-200 uppercase">
                    TAX INVOICE · AURA-2026-9024
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  GST APPROVED
                </span>
              </div>

              {/* Milligram breakdown table */}
              <div className="mt-5 space-y-2.5 font-mono text-xs text-stone-300">
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-400">Pure Net Weight:</span>
                  <span className="font-medium text-stone-100 tnums">
                    {formatWeight(invoice.netWeightGrams)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-400">
                    Wastage ({params.wastagePercent}%):
                  </span>
                  <span className="tnums">+{formatWeight(invoice.wastageGrams)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-400">Metal Base Value:</span>
                  <span className="font-medium text-stone-100 tnums">
                    {formatInr(invoice.totalMetalValue)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-400">Making Charges:</span>
                  <span className="tnums">+{formatInr(invoice.makingChargesTotal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-900">
                  <span className="text-stone-400">Taxable Value:</span>
                  <span className="font-medium text-stone-100 tnums">{formatInr(invoice.taxableAmount)}</span>
                </div>

                {/* Tax Breakdown */}
                {params.customerState === "INTRA_STATE" ? (
                  <>
                    <div className="flex justify-between py-0.5 text-stone-400 text-[11px]">
                      <span>CGST (1.5%):</span>
                      <span className="tnums">+{formatInr(invoice.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between py-0.5 text-stone-400 text-[11px]">
                      <span>SGST (1.5%):</span>
                      <span className="tnums">+{formatInr(invoice.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-0.5 text-stone-400 text-[11px]">
                    <span>IGST (3.0%):</span>
                    <span className="tnums">+{formatInr(invoice.igstAmount)}</span>
                  </div>
                )}

                {invoice.oldGoldDeduction > 0 && (
                  <div className="flex justify-between py-1 text-emerald-400 font-medium border-b border-stone-900">
                    <span>Old Gold Scrap Credit:</span>
                    <span className="tnums">-{formatInr(invoice.oldGoldDeduction)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total Block & Cryptographic HUID Seal */}
            <div className="mt-8 pt-5 border-t border-stone-800 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] uppercase font-mono tracking-wider text-stone-400">
                  Net Payable Total:
                </span>
                <span className="text-2xl sm:text-3xl font-light font-mono text-[#deb862] tnums">
                  {formatInr(invoice.netPayableAmount)}
                </span>
              </div>

              {/* Cryptographic BIS Seal */}
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-7 h-7 text-[#deb862]" />
                  <div>
                    <span className="text-[10px] text-stone-400 font-mono block">
                      BIS HUID VERIFIED
                    </span>
                    <span className="text-xs font-mono font-medium text-stone-200 tracking-wider">
                      {invoice.huidChecksum}
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </RevealUp>
    </section>
  );
}
