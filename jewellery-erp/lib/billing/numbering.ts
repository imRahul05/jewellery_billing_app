
import { type prisma } from "@/lib/db";

// Use parameters utility to dynamically extract the exact type of the transaction client
// passed by the extended prisma.$transaction callback.
export type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

/**
 * Derives the Indian financial year string (e.g., "2024-25") from a given date.
 * Indian Financial Year runs from April 1 to March 31.
 */
export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  
  // April is month index 3
  const startYear = month < 3 ? year - 1 : year;
  const endYearShort = String(startYear + 1).slice(-2);
  
  return `${startYear}-${endYearShort}`;
}

interface AssignNumberOptions {
  paddingWidth?: number;
  prefixOverride?: string;
}

/**
 * Concurrency-safe, gap-free invoice number generator.
 * Runs inside the same Prisma transaction as the finalization.
 */
export async function assignInvoiceNumber(
  tx: PrismaTransaction,
  tenantId: string,
  series: string, // e.g. "INV", "CM", "QTN", "CN", "PUR", "RINV", "JOB"
  invoiceDate: Date,
  options: AssignNumberOptions = {}
): Promise<string> {
  const fy = getFinancialYear(invoiceDate);
  const paddingWidth = options.paddingWidth ?? 5;

  // Atomically upsert the sequence counter for the tenant, series, and financial year.
  // The first execution will create the row with nextSeq = 1.
  // Subsequent executions will increment it.
  const counter = await tx.invoiceCounter.upsert({
    where: {
      tenantId_series_fy: {
        tenantId,
        series,
        fy,
      },
    },
    update: {
      nextSeq: {
        increment: 1,
      },
    },
    create: {
      tenantId,
      series,
      fy,
      nextSeq: 1,
    },
  });

  const seqNumber = Number(counter.nextSeq);
  const paddedSeq = String(seqNumber).padStart(paddingWidth, "0");
  const prefix = options.prefixOverride ?? series;

  return `${prefix}/${fy}/${paddedSeq}`;
}
