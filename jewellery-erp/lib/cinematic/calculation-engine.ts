import {
  InvoiceSimulationParams,
  InvoiceCalculationResult,
  MetalRatesSnapshot,
} from "./types";

export const LIVE_METAL_RATES: MetalRatesSnapshot = {
  gold24k: {
    purity: "99.9%",
    karat: "24K",
    ratePerGram: 7450.0,
    description: "Investment Grade Bullion",
  },
  gold22k: {
    purity: "91.6%",
    karat: "22K",
    ratePerGram: 6825.0,
    description: "Standard Fine Hallmarked Jewellery",
  },
  gold18k: {
    purity: "75.0%",
    karat: "18K",
    ratePerGram: 5588.0,
    description: "Diamond Setting & Haute Joaillerie",
  },
  gold14k: {
    purity: "58.5%",
    karat: "14K",
    ratePerGram: 4358.0,
    description: "Contemporary Daily Wear",
  },
  silver999: {
    purity: "99.9%",
    karat: "999",
    ratePerGram: 88.5,
    description: "Fine Silver Ingot",
  },
  platinum950: {
    purity: "95.0%",
    karat: "Pt950",
    ratePerGram: 3120.0,
    description: "Pure Platinum Alloy",
  },
};

/**
 * Rounds a number to exactly decimal places with high numerical precision.
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Generates an authentic-looking 6-character alphanumeric BIS Hallmark Unique Identification (HUID).
 */
export function generateHuid(seed: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let result = "";
  let current = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    result += chars[current % chars.length];
    current = Math.floor(current / chars.length) + (i * 7);
  }
  return result;
}

/**
 * Executes sub-milligram and currency calculations conforming to Indian Jewellery GST laws.
 */
export function calculateJewelleryInvoice(
  params: InvoiceSimulationParams,
  rates: MetalRatesSnapshot = LIVE_METAL_RATES
): InvoiceCalculationResult {
  const rateEntry = rates[params.purityKey];
  const rate = rateEntry.ratePerGram;

  // Milligram weight calculation (3 decimal places)
  const netWeight = Math.max(0, roundTo(params.grossWeightGrams - params.stoneWeightGrams, 3));
  const wastageWeight = roundTo((netWeight * params.wastagePercent) / 100, 3);
  const totalWeightForBilledMetal = roundTo(netWeight + wastageWeight, 3);

  // Financial computations
  const metalBaseValue = roundTo(netWeight * rate, 2);
  const wastageValue = roundTo(wastageWeight * rate, 2);
  const totalMetalValue = roundTo(totalWeightForBilledMetal * rate, 2);

  const makingChargesTotal = roundTo(netWeight * params.makingChargePerGram, 2);
  const taxableAmount = roundTo(totalMetalValue + makingChargesTotal, 2);

  // GST 3% (1.5% CGST + 1.5% SGST or 3% IGST)
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (params.customerState === "INTRA_STATE") {
    cgst = roundTo(taxableAmount * 0.015, 2);
    sgst = roundTo(taxableAmount * 0.015, 2);
  } else {
    igst = roundTo(taxableAmount * 0.03, 2);
  }
  const totalGst = roundTo(cgst + sgst + igst, 2);

  const grossInvoiceTotal = roundTo(taxableAmount + totalGst, 2);
  const oldGoldDeduction = roundTo(params.oldGoldExchangeValue, 2);
  const netPayableAmount = Math.max(0, roundTo(grossInvoiceTotal - oldGoldDeduction, 2));

  const huidSeed = `${params.purityKey}-${params.grossWeightGrams}-${grossInvoiceTotal}`;
  const huidChecksum = generateHuid(huidSeed);

  return {
    netWeightGrams: netWeight,
    purityMultiplier: params.purityKey === "gold24k" ? 1.0 : params.purityKey === "gold22k" ? 0.916 : 0.75,
    metalBaseValue,
    wastageGrams: wastageWeight,
    wastageValue,
    totalMetalValue,
    makingChargesTotal,
    taxableAmount,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    totalGst,
    grossInvoiceTotal,
    oldGoldDeduction,
    netPayableAmount,
    huidChecksum,
  };
}

/**
 * Formats Indian Currency (INR) with standard Lakhs and Crores grouping (e.g., ₹4,89,250.00)
 */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats weight with exact 3-decimal milligram precision.
 */
export function formatWeight(grams: number): string {
  return `${grams.toFixed(3)} g`;
}
