import { Prisma } from "@prisma/client";

export interface OldGoldInput {
  netWeight: Prisma.Decimal;
  purityRate: Prisma.Decimal;
  deductionPercent: Prisma.Decimal;
}

/**
 * Calculates the value of old gold brought in by the customer as exchange.
 * Formula: oldGoldValue = oldNetWeight × oldPurityRate × (1 − deductionPct/100)
 */
export function computeOldGoldValue(input: OldGoldInput): Prisma.Decimal {
  const netWeight = new Prisma.Decimal(input.netWeight);
  const purityRate = new Prisma.Decimal(input.purityRate);
  const deductionPercent = new Prisma.Decimal(input.deductionPercent);

  const multiplier = new Prisma.Decimal(1).sub(deductionPercent.div(100));
  const rawValue = netWeight.mul(purityRate).mul(multiplier);
  
  // Standard financial rounding: half-up to 2 decimals
  return rawValue.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
