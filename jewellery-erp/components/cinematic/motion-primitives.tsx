"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionWrapperProps } from "@/lib/cinematic/types";

// Register ScrollTrigger safely in browser context
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Checks if user prefers reduced motion
 */
export function checkPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reusable reveal-up motion primitive with ScrollTrigger coordination.
 */
export function RevealUp({
  children,
  className = "",
  delay = 0,
  duration = 0.9,
  direction = "up",
}: MotionWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    if (checkPrefersReducedMotion()) {
      el.style.opacity = "1";
      return;
    }

    let yOffset = 0;
    let xOffset = 0;
    if (direction === "up") {
      yOffset = 40;
    } else if (direction === "down") {
      yOffset = -40;
    } else if (direction === "left") {
      xOffset = 40;
    } else if (direction === "right") {
      xOffset = -40;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: yOffset,
          x: xOffset,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, el);

    return () => {
      ctx.revert();
    };
  }, [delay, duration, direction]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

export interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number; // 0.1 to 0.5
  className?: string;
}

/**
 * Parallax motion primitive that gently translates based on scroll scrubbing.
 */
export function ParallaxLayer({
  children,
  speed = 0.15,
  className = "",
}: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el || checkPrefersReducedMotion()) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: () => -100 * speed,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, el);

    return () => {
      ctx.revert();
    };
  }, [speed]);

  return (
    <div ref={layerRef} className={className}>
      {children}
    </div>
  );
}
