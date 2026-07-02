import { Prisma } from "@prisma/client";
import { GstStrategy, compositeGstStrategy, TaxBucket } from "./gst-strategy";
import { toIndianWords } from "./indian-words";

export interface LineItemInput {
  productId?: string | null;
  inventoryItemId?: string | null;
  hsnCodeId?: string | null;
  metalRateId?: string | null;
  description?: string;
  materialType?: string;
  karat?: number | null;
  quantity?: number;
  hsnCode?: string;
  grossWeight: Prisma.Decimal | number | string;
  stoneWeight: Prisma.Decimal | number | string;
  purity: Prisma.Decimal | number | string;
  metalRatePerGram: Prisma.Decimal | number | string;
  makingChargeType: "PER_GRAM" | "PERCENT" | "FLAT";
  makingChargeValue: Prisma.Decimal | number | string;
  wastageType: "PERCENT_WEIGHT" | "GRAMS" | "PERCENT_MAKING" | "NONE";
  wastageValue: Prisma.Decimal | number | string;
  stoneChargeType: "PER_CARAT" | "PER_PIECE" | "FLAT" | "NONE";
  stoneCarat: Prisma.Decimal | number | string;
  stonePieces: number;
  stoneRate: Prisma.Decimal | number | string;
  hallmarkCharges: Prisma.Decimal | number | string;
  otherCharges: Prisma.Decimal | number | string;
  lineDiscountType: "AMOUNT" | "PERCENT" | "NONE";
  lineDiscountValue: Prisma.Decimal | number | string;
  gstRatePercent: Prisma.Decimal | number | string;
  sellerStateCode: string;
  placeOfSupplyStateCode: string;
}

export interface LineItemResult {
  netWeight: Prisma.Decimal;
  chargeableWeight: Prisma.Decimal;
  metalValue: Prisma.Decimal;
  wastageValue: Prisma.Decimal; // reported separately for transparency (VA value)
  makingCharges: Prisma.Decimal;
  stoneCharges: Prisma.Decimal;
  lineGross: Prisma.Decimal;
  lineDiscount: Prisma.Decimal;
  taxableValue: Prisma.Decimal;
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  isIgst: boolean;
  taxBuckets: TaxBucket[];
}

export interface InvoiceCalculationResult {
  lines: LineItemResult[];
  subTotalTaxable: Prisma.Decimal;
  totalCgst: Prisma.Decimal;
  totalSgst: Prisma.Decimal;
  totalIgst: Prisma.Decimal;
  totalTax: Prisma.Decimal;
  oldGoldAdjustment: Prisma.Decimal;
  grandTotalBeforeRound: Prisma.Decimal;
  roundOff: Prisma.Decimal;
  grandTotal: Prisma.Decimal;
  amountInWords: string;
  taxBuckets: TaxBucket[]; // aggregated by HSN and tax rate
}

const round2 = (val: Prisma.Decimal): Prisma.Decimal => {
  return val.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
};

export function calculateLineItem(input: LineItemInput, gstStrategy: GstStrategy = compositeGstStrategy): LineItemResult {
  const grossWeight = new Prisma.Decimal(input.grossWeight);
  const stoneWeight = new Prisma.Decimal(input.stoneWeight);
  const purity = new Prisma.Decimal(input.purity);
  const metalRatePerGram = new Prisma.Decimal(input.metalRatePerGram);
  const makingChargeValue = new Prisma.Decimal(input.makingChargeValue);
  const wastageValue = new Prisma.Decimal(input.wastageValue);
  const stoneCarat = new Prisma.Decimal(input.stoneCarat);
  const stoneRate = new Prisma.Decimal(input.stoneRate);
  const hallmarkCharges = new Prisma.Decimal(input.hallmarkCharges);
  const otherCharges = new Prisma.Decimal(input.otherCharges);
  const lineDiscountValue = new Prisma.Decimal(input.lineDiscountValue);
  const gstRatePercent = new Prisma.Decimal(input.gstRatePercent);

  // Step 1: Net metal weight (GW − SW)
  const netWeight = grossWeight.sub(stoneWeight);
  if (netWeight.lessThan(0)) {
    throw new Error("Net weight cannot be negative (stone weight exceeds gross weight)");
  }

  // Step 3: Wastage (Convention 1 vs 2)
  let chargeableWeight = netWeight;
  let wastageGrams = new Prisma.Decimal(0);

  if (input.wastageType === "PERCENT_WEIGHT") {
    chargeableWeight = netWeight.mul(new Prisma.Decimal(1).add(wastageValue.div(100)));
    wastageGrams = chargeableWeight.sub(netWeight);
  } else if (input.wastageType === "GRAMS") {
    chargeableWeight = netWeight.add(wastageValue);
    wastageGrams = wastageValue;
  }

  const metalValue = round2(chargeableWeight.mul(metalRatePerGram));
  const wastageValComp = round2(wastageGrams.mul(metalRatePerGram));

  // Step 4: Making charges
  let makingCharges = new Prisma.Decimal(0);
  if (input.makingChargeType === "PER_GRAM") {
    makingCharges = netWeight.mul(makingChargeValue);
  } else if (input.makingChargeType === "PERCENT") {
    makingCharges = metalValue.mul(makingChargeValue).div(100);
  } else if (input.makingChargeType === "FLAT") {
    makingCharges = makingChargeValue;
  }

  // If Convention 2 wastage on making is used:
  if (input.wastageType === "PERCENT_MAKING") {
    makingCharges = makingCharges.mul(new Prisma.Decimal(1).add(wastageValue.div(100)));
  }
  makingCharges = round2(makingCharges);

  // Step 5: Stone charges
  let stoneCharges = new Prisma.Decimal(0);
  if (input.stoneChargeType === "PER_CARAT") {
    stoneCharges = stoneCarat.mul(stoneRate);
  } else if (input.stoneChargeType === "PER_PIECE") {
    stoneCharges = new Prisma.Decimal(input.stonePieces).mul(stoneRate);
  } else if (input.stoneChargeType === "FLAT") {
    stoneCharges = stoneRate;
  }
  stoneCharges = round2(stoneCharges);

  // Step 6: Hallmark & other charges
  const hc = round2(hallmarkCharges);
  const oc = round2(otherCharges);

  // Step 7: Line gross
  const lineGross = metalValue.add(makingCharges).add(stoneCharges).add(hc).add(oc);

  // Line Discount
  let lineDiscount = new Prisma.Decimal(0);
  if (input.lineDiscountType === "AMOUNT") {
    lineDiscount = lineDiscountValue;
  } else if (input.lineDiscountType === "PERCENT") {
    lineDiscount = lineGross.mul(lineDiscountValue).div(100);
  }
  lineDiscount = round2(lineDiscount);

  let taxableValue = lineGross.sub(lineDiscount);
  if (taxableValue.lessThan(0)) {
    taxableValue = new Prisma.Decimal(0);
  }

  // Apportion taxable value proportionally for GST components tracking
  const discountFactor = lineGross.greaterThan(0) ? taxableValue.div(lineGross) : new Prisma.Decimal(0);
  const metalTaxable = metalValue.add(makingCharges).mul(discountFactor);
  const stoneTaxable = stoneCharges.mul(discountFactor);
  const otherTaxable = hc.add(oc).mul(discountFactor);

  // Step 8: GST via Strategy
  const gstResult = gstStrategy.computeLineGst({
    hsnCode: input.hsnCode,
    metalTaxableValue: metalTaxable,
    stoneTaxableValue: stoneTaxable,
    otherTaxableValue: otherTaxable,
    gstRatePercent,
    sellerStateCode: input.sellerStateCode,
    placeOfSupplyStateCode: input.placeOfSupplyStateCode,
  });

  const totalTax = gstResult.cgst.add(gstResult.sgst).add(gstResult.igst);
  const lineTotal = taxableValue.add(totalTax);

  return {
    netWeight,
    chargeableWeight,
    metalValue,
    wastageValue: wastageValComp,
    makingCharges,
    stoneCharges,
    lineGross,
    lineDiscount,
    taxableValue,
    cgst: gstResult.cgst,
    sgst: gstResult.sgst,
    igst: gstResult.igst,
    lineTotal,
    isIgst: gstResult.isIgst,
    taxBuckets: gstResult.taxBuckets,
  };
}

export function calculateInvoice(
  linesInput: LineItemInput[],
  invoiceDiscountType: "AMOUNT" | "PERCENT" | "NONE",
  invoiceDiscountValue: Prisma.Decimal | number | string,
  oldGoldValue: Prisma.Decimal | number | string | null | undefined,
  gstStrategy: GstStrategy = compositeGstStrategy
): InvoiceCalculationResult {
  const discountVal = new Prisma.Decimal(invoiceDiscountValue || 0);
  const goldVal = new Prisma.Decimal(oldGoldValue || 0);

  // Compute base line item results (pre-invoice discount)
  const baseLines = linesInput.map(line => calculateLineItem(line, gstStrategy));

  // Compute sum of line-level taxable values to apportion invoice discount
  const sumPreDiscountTaxable = baseLines.reduce((acc, line) => acc.add(line.taxableValue), new Prisma.Decimal(0));

  // Calculate invoice discount
  let totalInvoiceDiscount = new Prisma.Decimal(0);
  if (invoiceDiscountType === "AMOUNT") {
    totalInvoiceDiscount = discountVal;
  } else if (invoiceDiscountType === "PERCENT") {
    totalInvoiceDiscount = sumPreDiscountTaxable.mul(discountVal).div(100);
  }
  totalInvoiceDiscount = round2(totalInvoiceDiscount);

  // Apportion discount across lines and re-run GST
  const finalLines = baseLines.map(line => {
    let lineInvoiceDiscount = new Prisma.Decimal(0);
    if (sumPreDiscountTaxable.greaterThan(0)) {
      lineInvoiceDiscount = totalInvoiceDiscount.mul(line.taxableValue).div(sumPreDiscountTaxable);
    }
    lineInvoiceDiscount = round2(lineInvoiceDiscount);

    let finalTaxable = line.taxableValue.sub(lineInvoiceDiscount);
    if (finalTaxable.lessThan(0)) {
      finalTaxable = new Prisma.Decimal(0);
    }

    // Recompute GST on final taxable value
    const baseLineInput = linesInput[baseLines.indexOf(line)];
    const grossWeight = new Prisma.Decimal(baseLineInput.grossWeight);
    const stoneWeight = new Prisma.Decimal(baseLineInput.stoneWeight);
    const netWeight = grossWeight.sub(stoneWeight);
    const chargeableWeight = line.chargeableWeight;

    // Proportions
    const finalDiscountFactor = line.lineGross.greaterThan(0) ? finalTaxable.div(line.lineGross) : new Prisma.Decimal(0);
    const metalTaxable = line.metalValue.add(line.makingCharges).mul(finalDiscountFactor);
    const stoneTaxable = line.stoneCharges.mul(finalDiscountFactor);
    const otherTaxable = round2(new Prisma.Decimal(baseLineInput.hallmarkCharges)).add(round2(new Prisma.Decimal(baseLineInput.otherCharges))).mul(finalDiscountFactor);

    const gstResult = gstStrategy.computeLineGst({
      hsnCode: baseLineInput.hsnCode,
      metalTaxableValue: metalTaxable,
      stoneTaxableValue: stoneTaxable,
      otherTaxableValue: otherTaxable,
      gstRatePercent: new Prisma.Decimal(baseLineInput.gstRatePercent),
      sellerStateCode: baseLineInput.sellerStateCode,
      placeOfSupplyStateCode: baseLineInput.placeOfSupplyStateCode,
    });

    const totalTax = gstResult.cgst.add(gstResult.sgst).add(gstResult.igst);
    const lineTotal = finalTaxable.add(totalTax);

    return {
      ...line,
      lineDiscount: line.lineDiscount.add(lineInvoiceDiscount), // sum of line-discount + apportioned invoice discount
      taxableValue: finalTaxable,
      cgst: gstResult.cgst,
      sgst: gstResult.sgst,
      igst: gstResult.igst,
      lineTotal,
      taxBuckets: gstResult.taxBuckets,
    };
  });

  // Sum everything up
  const subTotalTaxable = finalLines.reduce((acc, line) => acc.add(line.taxableValue), new Prisma.Decimal(0));
  const totalCgst = finalLines.reduce((acc, line) => acc.add(line.cgst), new Prisma.Decimal(0));
  const totalSgst = finalLines.reduce((acc, line) => acc.add(line.sgst), new Prisma.Decimal(0));
  const totalIgst = finalLines.reduce((acc, line) => acc.add(line.igst), new Prisma.Decimal(0));
  const totalTax = totalCgst.add(totalSgst).add(totalIgst);

  const grandTotalBeforeRound = subTotalTaxable.add(totalTax).sub(goldVal);
  
  // Round final total to nearest rupee
  const grandTotal = grandTotalBeforeRound.round();
  const roundOff = grandTotal.sub(grandTotalBeforeRound);

  // Compute Indian words representation
  const amountInWords = toIndianWords(grandTotal);

  // Aggregated tax buckets by HSN + rate for invoice display/summary
  const taxBucketsMap = new Map<string, TaxBucket>();
  for (const line of finalLines) {
    for (const bucket of line.taxBuckets) {
      const key = `${bucket.hsnCode}-${bucket.rate.toString()}`;
      const existing = taxBucketsMap.get(key);
      if (existing) {
        taxBucketsMap.set(key, {
          hsnCode: bucket.hsnCode,
          rate: bucket.rate,
          taxableValue: existing.taxableValue.add(bucket.taxableValue),
          cgst: existing.cgst.add(bucket.cgst),
          sgst: existing.sgst.add(bucket.sgst),
          igst: existing.igst.add(bucket.igst),
        });
      } else {
        taxBucketsMap.set(key, { ...bucket });
      }
    }
  }

  return {
    lines: finalLines,
    subTotalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    oldGoldAdjustment: goldVal,
    grandTotalBeforeRound,
    roundOff,
    grandTotal,
    amountInWords,
    taxBuckets: Array.from(taxBucketsMap.values()),
  };
}
