import { Prisma } from "@prisma/client";

export interface TaxBucket {
  hsnCode: string;
  taxableValue: Prisma.Decimal;
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
  rate: Prisma.Decimal;
}

export interface GstStrategyInput {
  hsnCode?: string;
  metalTaxableValue: Prisma.Decimal;    // metal + wastage + making
  stoneTaxableValue: Prisma.Decimal;    // stone charges
  otherTaxableValue: Prisma.Decimal;    // hallmark, other
  gstRatePercent: Prisma.Decimal;       // e.g. 3.000 for HSN 7113
  sellerStateCode: string;
  placeOfSupplyStateCode: string;
}

export interface GstStrategyResult {
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
  isIgst: boolean;
  taxBuckets: TaxBucket[];
}

export interface GstStrategy {
  computeLineGst(params: GstStrategyInput): GstStrategyResult;
}

// Maharashtra, Karnataka, etc. GST state codes are 2-digits.
// Comparing first 2 digits of GSTIN or state code itself.
export const compositeGstStrategy: GstStrategy = {
  computeLineGst(params: GstStrategyInput): GstStrategyResult {
    const isIgst = params.sellerStateCode.substring(0, 2) !== params.placeOfSupplyStateCode.substring(0, 2);
    
    // Total taxable value = metal + stone + other
    const totalTaxable = params.metalTaxableValue
      .add(params.stoneTaxableValue)
      .add(params.otherTaxableValue);

    // standard half-up rounding helper to 2 decimals
    const round2 = (val: Prisma.Decimal): Prisma.Decimal => {
      return val.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    };

    let cgst = new Prisma.Decimal(0);
    let sgst = new Prisma.Decimal(0);
    let igst = new Prisma.Decimal(0);

    const gstRatePercent = params.gstRatePercent;

    if (isIgst) {
      igst = round2(totalTaxable.mul(gstRatePercent).div(100));
    } else {
      const halfRate = gstRatePercent.div(2);
      cgst = round2(totalTaxable.mul(halfRate).div(100));
      sgst = cgst; // SGST equals CGST
    }

    const hsn = params.hsnCode || "7113";
    const taxBuckets: TaxBucket[] = [
      {
        hsnCode: hsn,
        taxableValue: totalTaxable,
        cgst,
        sgst,
        igst,
        rate: gstRatePercent,
      },
    ];

    return {
      cgst,
      sgst,
      igst,
      isIgst,
      taxBuckets,
    };
  },
};
