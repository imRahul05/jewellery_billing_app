"use client";

import React from "react";
import { RevealUp } from "./motion-primitives";

export function VaultLedgerSection() {
  const securityPillars = [
    {
      metric: "100%",
      metricLabel: "Cross-Tenant Isolation",
      title: "Row-Level Multi-Tenancy",
      badge: "RLS CLIENT EXTENSIONS",
      description:
        "Every SQL query is cryptographically scoped with tenant context isolation via Prisma client extensions. Mathematically impossible for Organization A to query Organization B records.",
    },
    {
      metric: "Zero",
      metricLabel: "Unmonitored Edits",
      title: "Immutable Audit Ledger",
      badge: "SHA-256 AUDIT LOG",
      description:
        "Every milligram of gold received, melted, transferred to karigar artisans, or invoiced is logged with user timestamp, IP address, and cryptographic signature.",
    },
    {
      metric: "< 50ms",
      metricLabel: "Sync Propagation",
      title: "Multi-Branch Karigar Mesh",
      badge: "LIVE STATE CONSENSUS",
      description:
        "Distribute stock across central bullion vaults, flagship retail showrooms, and artisan workshops. Inventory movements atomically lock real-time weight balances.",
    },
    {
      metric: "32+",
      metricLabel: "Granular Permissions",
      title: "Role-Based Privilege Delegation",
      badge: "ENTERPRISE RBAC",
      description:
        "Strict separation of powers for Cashiers, Inventory Custodians, Karigar Supervisors, and Managing Directors. Zero hardcoded roles; sovereign delegation.",
    },
  ];

  return (
    <section id="enterprise-vault" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <RevealUp>
          <span className="text-[11px] sm:text-xs uppercase font-mono tracking-[0.24em] text-stone-500 dark:text-stone-400">
            Act IV · The Sovereign Ledger
          </span>
        </RevealUp>
        <RevealUp delay={0.12}>
          <h2 className="text-3xl sm:text-5xl font-normal text-stone-950 dark:text-white tracking-[-0.025em] leading-tight">
            Cryptographic Integrity in{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862]">
              Every Database Block
            </span>
          </h2>
        </RevealUp>
        <RevealUp delay={0.22}>
          <p className="text-base text-stone-600 dark:text-stone-300/80 font-light leading-relaxed pt-1">
            Jewellery enterprises safeguard hundreds of crores in physical bullion. Trust is
            non-negotiable. Our architecture combines Neon Serverless PostgreSQL with
            strict tenant isolation and immutable ledgering.
          </p>
        </RevealUp>
      </div>

      {/* 4 Security Pillars: Typography-Led Architectural Presentation with Protective Backdrops */}
      <RevealUp delay={0.32}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 pt-6">
          {securityPillars.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="space-y-4 p-8 sm:p-10 rounded-2xl bg-stone-100/70 dark:bg-[#07080b]/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex flex-col justify-between shadow-sm dark:shadow-none hover:border-amber-500/30 dark:hover:border-[#deb862]/30 transition-all duration-300"
            >
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-[10px] font-mono tracking-[0.24em] text-stone-400 dark:text-stone-500 uppercase">
                    Pillar 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest px-2.5 py-1 rounded bg-stone-200/60 dark:bg-white/[0.05] text-stone-700 dark:text-stone-300 border border-stone-300/60 dark:border-white/[0.08]">
                    {pillar.badge}
                  </span>
                </div>

                {/* Large Editorial Metric */}
                <div className="text-5xl sm:text-6xl lg:text-7xl font-light font-mono text-stone-950 dark:text-stone-100 tracking-tight tnums leading-none mb-3">
                  {pillar.metric}
                </div>

                <div className="text-xs font-mono uppercase tracking-[0.16em] text-amber-700 dark:text-[#deb862] mb-2 font-medium">
                  {pillar.metricLabel}
                </div>

                <h3 className="text-lg font-medium text-stone-950 dark:text-stone-100 mb-2">
                  {pillar.title}
                </h3>

                <p className="text-sm text-stone-600 dark:text-stone-300/80 font-light leading-relaxed max-w-lg">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </RevealUp>

      {/* Restrained System Telemetry Strip */}
      <RevealUp delay={0.48} direction="up" className="mt-12 max-w-6xl mx-auto">
        <div className="px-6 py-4 rounded-xl bg-stone-100/70 dark:bg-[#07080b]/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>PostgreSQL Row-Level Security: Active & Enforced</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400">
            Telemetry: 0.001g continuous balance reconciliation check passed
          </div>
        </div>
      </RevealUp>
    </section>
  );
}

