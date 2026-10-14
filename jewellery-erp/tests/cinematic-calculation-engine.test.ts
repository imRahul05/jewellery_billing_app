import { describe, it, expect } from "vitest";
import {
  calculateJewelleryInvoice,
  formatInr,
  formatWeight,
  generateHuid,
  LIVE_METAL_RATES,
} from "../lib/cinematic/calculation-engine";
import { InvoiceSimulationParams } from "../lib/cinematic/types";

describe("Cinematic Calculation Engine Unit Tests", () => {
  it("formats weight with exact 3-decimal milligram precision", () => {
    expect(formatWeight(16.5)).toBe("16.500 g");
    expect(formatWeight(0.001)).toBe("0.001 g");
    expect(formatWeight(0)).toBe("0.000 g");
    expect(formatWeight(123.4567)).toBe("123.457 g");
  });

  it("formats INR currency in Indian numbering notation", () => {
    const formatted = formatInr(125000);
    expect(formatted).toContain("1,25,000");
  });

  it("generates 6-character alphanumeric BIS HUID checksum", () => {
    const huid = generateHuid("gold22k-16.5-125000");
    expect(huid).toHaveLength(6);
    expect(/^[A-Z0-9]{6}$/.test(huid)).toBe(true);
  });

  it("accurately computes Intra-State GST invoice breakdown", () => {
    const params: InvoiceSimulationParams = {
      purityKey: "gold22k",
      grossWeightGrams: 10.0,
      stoneWeightGrams: 1.0,
      wastagePercent: 5.0,
      makingChargePerGram: 500,
      oldGoldExchangeValue: 0,
      customerState: "INTRA_STATE",
    };

    const result = calculateJewelleryInvoice(params, LIVE_METAL_RATES);

    // Net weight = 10 - 1 = 9.000 g
    expect(result.netWeightGrams).toBe(9.0);
    // Wastage = 9 * 5% = 0.450 g
    expect(result.wastageGrams).toBe(0.45);

    // Rate for 22k is 6825.0
    // Total metal value = (9.0 + 0.45) * 6825 = 9.45 * 6825 = 64496.25
    expect(result.totalMetalValue).toBe(64496.25);

    // Making charges = 9.0 * 500 = 4500.00
    expect(result.makingChargesTotal).toBe(4500.0);

    // Taxable amount = 64496.25 + 4500.00 = 68996.25
    expect(result.taxableAmount).toBe(68996.25);

    // CGST = 1.5% of 68996.25 = 1034.94
    expect(result.cgstAmount).toBe(1034.94);
    // SGST = 1.5% of 68996.25 = 1034.94
    expect(result.sgstAmount).toBe(1034.94);
    expect(result.igstAmount).toBe(0);
    expect(result.totalGst).toBe(2069.88);

    // Gross total = 68996.25 + 2069.88 = 71066.13
    expect(result.grossInvoiceTotal).toBe(71066.13);
    expect(result.netPayableAmount).toBe(71066.13);
  });

  it("accurately computes Inter-State IGST (3%) and Old Gold credit deduction", () => {
    const params: InvoiceSimulationParams = {
      purityKey: "gold24k",
      grossWeightGrams: 20.0,
      stoneWeightGrams: 0.0,
      wastagePercent: 0.0,
      makingChargePerGram: 300,
      oldGoldExchangeValue: 25000,
      customerState: "INTER_STATE",
    };

    const result = calculateJewelleryInvoice(params, LIVE_METAL_RATES);

    expect(result.netWeightGrams).toBe(20.0);
    expect(result.wastageGrams).toBe(0.0);

    // 24k rate = 7450.0. Total metal value = 20 * 7450 = 149000
    expect(result.totalMetalValue).toBe(149000);
    // Making = 20 * 300 = 6000
    expect(result.makingChargesTotal).toBe(6000);
    // Taxable = 155000
    expect(result.taxableAmount).toBe(155000);

    // IGST = 3% of 155000 = 4650
    expect(result.igstAmount).toBe(4650);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);

    // Gross = 155000 + 4650 = 159650
    expect(result.grossInvoiceTotal).toBe(159650);
    // Net payable = 159650 - 25000 = 134650
    expect(result.netPayableAmount).toBe(134650);
  });

  it("prevents negative net payable amount when old gold exceeds invoice total", () => {
    const params: InvoiceSimulationParams = {
      purityKey: "gold14k",
      grossWeightGrams: 2.0,
      stoneWeightGrams: 0.0,
      wastagePercent: 0.0,
      makingChargePerGram: 200,
      oldGoldExchangeValue: 50000,
      customerState: "INTRA_STATE",
    };

    const result = calculateJewelleryInvoice(params, LIVE_METAL_RATES);
    expect(result.netPayableAmount).toBe(0);
  });
});
