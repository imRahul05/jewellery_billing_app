"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function CinematicFooter() {
  return (
    <footer className="relative border-t border-stone-200/70 dark:border-white/[0.08] bg-stone-50 dark:bg-[#060709] pt-16 pb-12 px-4 sm:px-6 lg:px-8 z-10 text-stone-600 dark:text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-200/60 dark:border-white/[0.06]">
        {/* Brand identity */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-stone-200/60 dark:bg-white/[0.04] border border-stone-300/80 dark:border-white/[0.1] flex items-center justify-center">
              <span className="font-serif italic font-semibold text-xs text-amber-700 dark:text-[#deb862]">
                A
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold tracking-[0.24em] text-stone-900 dark:text-stone-100 uppercase">
                AURA
              </span>
              <span className="text-[10px] tracking-[0.16em] text-amber-700/80 dark:text-[#deb862]/80 font-mono font-medium">
                ERP
              </span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 font-light">
            Sovereign cloud enterprise resource planning and billing platform tailored for
            the Indian precious metals industry. Engineered for sub-milligram precision,
            concurrency, and audit verification.
          </p>
        </div>

        {/* Technical Architecture Links */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-900 dark:text-stone-200 font-medium block">
            Architecture
          </span>
          <ul className="space-y-2.5 text-stone-600 dark:text-stone-400">
            <li>
              <a href="#science" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">
                Sub-Milligram Metallurgy
              </a>
            </li>
            <li>
              <a href="#billing-engine" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">
                High-Frequency GST Engine
              </a>
            </li>
            <li>
              <a href="#enterprise-vault" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">
                Row-Level Multi-Tenancy
              </a>
            </li>
            <li>
              <a href="#transformation" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">
                Ledger Transition Matrix
              </a>
            </li>
          </ul>
        </div>

        {/* Regulatory & Compliance */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-900 dark:text-stone-200 font-medium block">
            Regulatory Standards
          </span>
          <ul className="space-y-2.5 font-mono text-[11px] text-stone-600 dark:text-stone-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>BIS 6-Digit HUID Traceability</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#deb862]" />
              <span>Section 170 CGST Act Rounding</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Neon Point-in-Time Audit History</span>
            </li>
          </ul>
        </div>

        {/* Direct Access */}
        <div className="space-y-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-900 dark:text-stone-200 font-medium block">
            Direct Access
          </span>
          <div className="space-y-2.5">
            <a
              href="#demo-portal"
              className="inline-flex items-center gap-1.5 text-amber-700 dark:text-[#deb862] hover:text-amber-800 dark:hover:text-[#e6ca85] font-mono font-medium"
            >
              <span>Instant Demo Sandbox</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div>
              <Link
                href="/login"
                className="text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white transition-colors block"
              >
                Tenant Workspace Login →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-500 gap-4">
        <span>
          © {new Date().getFullYear()} AURA Jewellery ERP. Sovereign Bullion Infrastructure.
        </span>
        <div className="flex gap-6">
          <span>PRECISION: 0.001G</span>
          <span>TAX: SEC 170 CGST</span>
          <span>ISOLATION: ACID RLS</span>
        </div>
      </div>
    </footer>
  );
}
