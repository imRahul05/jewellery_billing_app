import "server-only";
import { prisma } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { runWithTenant } from "@/lib/db/tenant-context";

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
}

export interface SalesPurchaseSummary {
  salesCount: number;
  salesTotal: string;
  purchaseCount: number;
  purchaseTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
}

export interface PaymentBreakdown {
  method: string;
  count: number;
  total: string;
}

export interface InventoryStats {
  inStockCount: number;
  inStockGrossWeight: string;
  inStockNetWeight: string;
  inStockCostPrice: string;
}

export interface ReportData {
  summary: SalesPurchaseSummary;
  payments: PaymentBreakdown[];
  inventory: InventoryStats;
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    grandTotal: string;
    invoiceDate: string;
    customerName: string | null;
  }[];
}

/**
 * Fetch and aggregate financial and operational report data for a given tenant and date range.
 */
export async function getReportsQuery(
  tenantId: string,
  filters: ReportFilters
): Promise<ReportData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`reports-${tenantId}`);

  return runWithTenant({ tenantId, userId: "system-cache", isSuperAdmin: false }, async () => {
    const { startDate, endDate } = filters;

    // 1. Fetch Invoices within range
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    // 2. Fetch Payments completed within range
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: "completed",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3. Fetch Inventory summaries (all-time snapshot of what's in stock)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: "in_stock",
        deletedAt: null,
      },
      select: {
        grossWeight: true,
        netWeight: true,
        costPrice: true,
      },
    });

    // Calculate Sales and Purchases
    let salesCount = 0;
    let salesTotal = new Prisma.Decimal(0);
    let purchaseCount = 0;
    let purchaseTotal = new Prisma.Decimal(0);
    let cgstTotal = new Prisma.Decimal(0);
    let sgstTotal = new Prisma.Decimal(0);
    let igstTotal = new Prisma.Decimal(0);

    for (const inv of invoices) {
      if (inv.status === "cancelled" || inv.status === "void" || inv.status === "draft") continue;

      if (inv.type === "sales") {
        salesCount++;
        salesTotal = salesTotal.add(inv.grandTotal);
        cgstTotal = cgstTotal.add(inv.cgstTotal);
        sgstTotal = sgstTotal.add(inv.sgstTotal);
        igstTotal = igstTotal.add(inv.igstTotal);
      } else if (inv.type === "purchase") {
        purchaseCount++;
        purchaseTotal = purchaseTotal.add(inv.grandTotal);
      }
    }

    // Group payments by method
    const paymentMethodsMap: Record<string, { count: number; total: Prisma.Decimal }> = {};
    for (const p of payments) {
      const method = p.method;
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, total: new Prisma.Decimal(0) };
      }
      paymentMethodsMap[method].count++;
      paymentMethodsMap[method].total = paymentMethodsMap[method].total.add(p.amount);
    }

    const paymentsList: PaymentBreakdown[] = Object.entries(paymentMethodsMap).map(([method, val]) => ({
      method,
      count: val.count,
      total: val.total.toString(),
    }));

    // Aggregate inventory weights and costs
    let inStockGrossWeight = new Prisma.Decimal(0);
    let inStockNetWeight = new Prisma.Decimal(0);
    let inStockCostPrice = new Prisma.Decimal(0);

    for (const item of inventoryItems) {
      inStockGrossWeight = inStockGrossWeight.add(item.grossWeight);
      inStockNetWeight = inStockNetWeight.add(item.netWeight);
      inStockCostPrice = inStockCostPrice.add(item.costPrice);
    }

    // Format recent 10 invoices for list view
    const recentInvoices = invoices.slice(0, 10).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      type: inv.type,
      status: inv.status,
      grandTotal: inv.grandTotal.toString(),
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName: inv.customer?.name || null,
    }));

    return {
      summary: {
        salesCount,
        salesTotal: salesTotal.toString(),
        purchaseCount,
        purchaseTotal: purchaseTotal.toString(),
        cgstTotal: cgstTotal.toString(),
        sgstTotal: sgstTotal.toString(),
        igstTotal: igstTotal.toString(),
      },
      payments: paymentsList,
      inventory: {
        inStockCount: inventoryItems.length,
        inStockGrossWeight: inStockGrossWeight.toString(),
        inStockNetWeight: inStockNetWeight.toString(),
        inStockCostPrice: inStockCostPrice.toString(),
      },
      recentInvoices,
    };
  });
}
