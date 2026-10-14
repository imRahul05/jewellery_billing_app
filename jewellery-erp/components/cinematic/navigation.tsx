"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Sun,
  Moon,
} from "lucide-react";

export function CinematicNavigation() {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/85 dark:bg-[#060709]/85 backdrop-blur-xl border-b border-stone-200/60 dark:border-white/[0.07] py-3.5 shadow-sm dark:shadow-none"
          : "bg-transparent py-5 sm:py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* Brand Crest */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.1] flex items-center justify-center group-hover:border-amber-400/50 transition-colors">
            <span className="font-serif italic font-semibold text-xs text-amber-700 dark:text-[#deb862]">
              A
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.26em] text-stone-900 dark:text-stone-100 uppercase">
                AURA
              </span>
              <span className="text-[10px] tracking-[0.16em] text-amber-700/80 dark:text-[#deb862]/80 font-mono font-medium">
                ERP
              </span>
            </div>
            <span className="text-[9px] text-stone-500 dark:text-stone-400 font-mono tracking-[0.16em] uppercase">
              Bullion & Jewellery
            </span>
          </div>
        </Link>

        {/* Navigation Anchors */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-[11px] lg:text-xs tracking-[0.16em] uppercase font-medium text-stone-600 dark:text-stone-400">
          <a
            href="#science"
            className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            The Science
          </a>
          <a
            href="#billing-engine"
            className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            Live Billing
          </a>
          <a
            href="#enterprise-vault"
            className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            Sovereign Vault
          </a>
          <a
            href="#transformation"
            className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            Ledger Transition
          </a>
        </nav>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle colour theme"
            className="p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/[0.06] border border-transparent dark:border-white/[0.04] transition-colors cursor-pointer"
          >
            <Sun className="w-3.5 h-3.5 text-amber-700 dark:hidden" />
            <Moon className="hidden w-3.5 h-3.5 text-[#deb862] dark:block" />
          </button>

          <Link
            href="/login"
            className="hidden sm:inline-flex px-3 py-1.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
          >
            Sign In
          </Link>

          <a
            href="#demo-portal"
            className="group px-4 py-2 rounded-md bg-[#deb862] text-[#08090c] font-semibold text-[11px] sm:text-xs uppercase tracking-[0.12em] flex items-center gap-1.5 hover:bg-[#e6ca85] transition-all duration-200 whitespace-nowrap shadow-sm"
          >
            <span>Launch Sandbox</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </header>
  );
}
