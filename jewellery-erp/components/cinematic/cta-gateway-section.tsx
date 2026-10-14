"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signInAsDemo } from "@/app/(auth)/login/actions";
import { RevealUp } from "./motion-primitives";

export function CtaGatewaySection() {
  const [demoState, demoFormAction, isDemoPending] = useActionState(signInAsDemo, null);

  const roles = [
    {
      title: "Business Owner",
      badge: "EXECUTIVE SUITE",
      desc: "Live bullion profit margins, tenant ledger audits, branch transfer approvals, and financial GST reports.",
    },
    {
      title: "Store Cashier",
      badge: "BILLING TERMINAL",
      desc: "Instant counter billing, split tender (Cash / UPI / Old Gold), thermal invoice printing, and HUID verification.",
    },
    {
      title: "Karigar Artisan Supervisor",
      badge: "VAULT & MELT",
      desc: "Raw metal issue tracking, scrap weight reconciliation, wastage variance logs, and barcode tagging.",
    },
  ];

  return (
    <section id="demo-portal" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
      <RevealUp>
        <div className="relative rounded-2xl overflow-hidden bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] p-8 sm:p-14 lg:p-16 text-center space-y-8 shadow-sm dark:shadow-none">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#deb862]" />
            <span>Instant Demo Sandbox · Zero Friction</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-normal text-stone-950 dark:text-white tracking-[-0.03em] max-w-4xl mx-auto leading-tight">
            Take Control of the Gold Ledger.{" "}
            <span className="font-serif italic font-normal text-amber-800 dark:text-[#deb862] block sm:inline">
              Enter Without Credentials.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300/80 max-w-2xl mx-auto font-light leading-relaxed">
            Experience our sovereign cloud architecture pre-loaded with sample jewellery inventories,
            real-time bullion market feeds, and precision GST invoicing.
          </p>

          {/* Role Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto text-left pt-3">
            {roles.map((r) => (
              <div
                key={r.title}
                className="p-5 sm:p-6 rounded-xl bg-stone-50/70 dark:bg-white/[0.02] border border-stone-200/60 dark:border-white/[0.05] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-amber-700 dark:text-[#deb862] uppercase font-medium">
                    {r.badge}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-stone-950 dark:text-stone-100">{r.title}</h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-light">{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Actions & Error Display */}
          <div className="pt-4 flex flex-col items-center justify-center space-y-4">
            {demoState?.error && (
              <div className="max-w-md p-3 rounded-lg bg-rose-50 dark:bg-red-950/40 border border-rose-300 dark:border-red-500/40 text-rose-800 dark:text-red-300 text-xs font-mono">
                {demoState.error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4">
              <form action={demoFormAction}>
                <button
                  type="submit"
                  disabled={isDemoPending}
                  className="px-8 py-3.5 rounded-md bg-[#deb862] text-[#08090c] font-semibold text-xs uppercase tracking-[0.14em] flex items-center gap-2 hover:bg-[#e6ca85] transition-all duration-200 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <span>{isDemoPending ? "Initializing Sandbox..." : "Enter Live Demo Sandbox"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <Link
                href="/login"
                className="px-6 py-3.5 rounded-md text-stone-700 hover:text-stone-950 dark:text-stone-300 dark:hover:text-white text-xs uppercase tracking-[0.14em] font-medium border border-stone-300/80 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/25 transition-all duration-200"
              >
                Sign In With Existing Organization
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 dark:text-stone-400 font-mono pt-3">
              <span>● Pre-Seeded Indian Inventory</span>
              <span>● Zero Credit Card Required</span>
              <span>● Point-in-Time Concurrency</span>
            </div>
          </div>
        </div>
      </RevealUp>
    </section>
  );
}
