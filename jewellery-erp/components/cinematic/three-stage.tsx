"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  createCinematicThreeScene,
  ThreeSceneController,
} from "@/lib/cinematic/three-scene";
import { checkPrefersReducedMotion } from "./motion-primitives";

export interface ThreeStageProps {
  scrollProgress: number;
  className?: string;
}

export function ThreeStage({ scrollProgress, className = "" }: ThreeStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneControllerRef = useRef<ThreeSceneController | null>(null);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef<"light" | "dark">(
    resolvedTheme === "light" ? "light" : "dark"
  );

  useEffect(() => {
    themeRef.current = resolvedTheme === "light" ? "light" : "dark";
  }, [resolvedTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    if (checkPrefersReducedMotion()) {
      return;
    }

    try {
      const controller = createCinematicThreeScene({
        canvas,
        container,
        initialTheme: themeRef.current,
      });
      sceneControllerRef.current = controller;

      const handleResize = () => {
        controller.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        controller.dispose();
        sceneControllerRef.current = null;
      };
    } catch {
      container.style.display = "none";
    }
  }, []);

  useEffect(() => {
    if (sceneControllerRef.current && resolvedTheme) {
      sceneControllerRef.current.setTheme(
        resolvedTheme === "light" ? "light" : "dark"
      );
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (sceneControllerRef.current) {
      sceneControllerRef.current.updateScrollProgress(scrollProgress);
    }
  }, [scrollProgress]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
