/**
 * Strict TypeScript interfaces for the Cinematic Web Experience.
 * Rule: Absolute ban on 'any' and 'unknown'.
 */

export interface MetalRateEntry {
  purity: string;
  karat: string;
  ratePerGram: number;
  description: string;
}

export interface MetalRatesSnapshot {
  gold24k: MetalRateEntry;
  gold22k: MetalRateEntry;
  gold18k: MetalRateEntry;
  gold14k: MetalRateEntry;
  silver999: MetalRateEntry;
  platinum950: MetalRateEntry;
}

export interface InvoiceSimulationParams {
  purityKey: "gold24k" | "gold22k" | "gold18k" | "gold14k";
  grossWeightGrams: number;
  stoneWeightGrams: number;
  wastagePercent: number;
  makingChargePerGram: number;
  oldGoldExchangeValue: number;
  customerState: "INTRA_STATE" | "INTER_STATE";
}

export interface InvoiceCalculationResult {
  netWeightGrams: number;
  purityMultiplier: number;
  metalBaseValue: number;
  wastageGrams: number;
  wastageValue: number;
  totalMetalValue: number;
  makingChargesTotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  grossInvoiceTotal: number;
  oldGoldDeduction: number;
  netPayableAmount: number;
  huidChecksum: string;
}

export interface CameraWayPoint {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface StageProgressState {
  progress: number;
  activeSectionIndex: number;
  isReducedMotion: boolean;
}

export interface FeaturePillar {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  metric: string;
  metricLabel: string;
}

export interface TransformationComparison {
  id: string;
  category: string;
  legacyPain: string;
  auraAdvantage: string;
  impactMetric: string;
}

export interface DemoRoleOption {
  id: string;
  name: string;
  tagline: string;
  permissions: string[];
  recommendedRoleBadge: string;
}

export interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}
