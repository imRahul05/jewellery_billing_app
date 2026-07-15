import "server-only";
import { prisma } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";
import { Prisma, MetalType, InvoiceType, InvoiceStatus } from "@prisma/client";
import { runWithTenant } from "@/lib/db/tenant-context";

export interface DashboardKpis {
  todaysSales: string;
  monthSales: string;
  outstanding: string;
  lowStockCount: number;
}

export interface DashboardMetalRate {
  id: string;
  metalType: MetalType;
  purityFineness: string | null;
  ratePerGram: string;
}

export interface DashboardRecentInvoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  status: InvoiceStatus;
  grandTotal: string;
  invoiceDate: string;
  customerName: string | null;
}

export interface SalesTrendPoint {
  date: string;
  total: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  metalRates: DashboardMetalRate[];
  recentInvoices: DashboardRecentInvoice[];
  salesTrend: SalesTrendPoint[];
}

/**
 * Fetch and aggregate dashboard summary data for a given tenant.
 */
export async function getDashboardStatsQuery(tenantId: string): Promise<DashboardData> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`dashboard-${tenantId}`);

  return runWithTenant({ tenantId, userId: "system-cache", isSuperAdmin: false }, async () => {
    const now = new Date();
    
    // 1. Time bounds (Using UTC to align with PostgreSQL DATE type)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // 2. Fetch Invoices within month
    const monthInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        invoiceDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { invoiceDate: "desc" },
    });

    // 3. Outstanding receivables (all-time outstanding balanceDue on sales invoices)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        type: "sales",
        deletedAt: null,
        status: {
          in: ["issued", "partially_paid"],
        },
      },
      select: {
        balanceDue: true,
      },
    });

    // 4. Low stock: count active products where active in-stock item count < 3
    // We group inventory_items by product_id where status = 'in_stock'
    const inventoryCounts = await prisma.inventoryItem.groupBy({
      by: ["productId"],
      where: {
        tenantId,
        status: "in_stock",
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const activeProducts = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const stockMap = new Map<string, number>();
    for (const countItem of inventoryCounts) {
      stockMap.set(countItem.productId, countItem._count.id);
    }

    let lowStockCount = 0;
    for (const prod of activeProducts) {
      const stockQty = stockMap.get(prod.id) ?? 0;
      if (stockQty < 3) {
        lowStockCount++;
      }
    }

    // Calculations for sales totals
    let todaysSales = new Prisma.Decimal(0);
    let monthSales = new Prisma.Decimal(0);

    for (const inv of monthInvoices) {
      if (inv.status === "cancelled" || inv.status === "void" || inv.status === "draft") continue;
      if (inv.type !== "sales") continue;

      monthSales = monthSales.add(inv.grandTotal);

      const invTime = inv.invoiceDate.getTime();
      if (invTime >= todayStart.getTime() && invTime <= todayEnd.getTime()) {
        todaysSales = todaysSales.add(inv.grandTotal);
      }
    }

    let outstanding = new Prisma.Decimal(0);
    for (const inv of unpaidInvoices) {
      outstanding = outstanding.add(inv.balanceDue);
    }

    // 5. Metal Rates: latest rate per metal type (Gold, Silver, Platinum)
    const distinctMetals: MetalType[] = ["gold", "silver", "platinum"];
    const metalRatesList: DashboardMetalRate[] = [];

    for (const mType of distinctMetals) {
      const latestRate = await prisma.metalRate.findFirst({
        where: {
          tenantId,
          metalType: mType,
        },
        orderBy: [
          { rateDate: "desc" },
          { createdAt: "desc" },
        ],
      });

      if (latestRate) {
        metalRatesList.push({
          id: latestRate.id,
          metalType: latestRate.metalType,
          purityFineness: latestRate.purityFineness ? latestRate.purityFineness.toString() : null,
          ratePerGram: latestRate.ratePerGram.toString(),
        });
      }
    }

    // 6. Recent Invoices (latest 5)
    const recentInvoices: DashboardRecentInvoice[] = monthInvoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      type: inv.type,
      status: inv.status,
      grandTotal: inv.grandTotal.toString(),
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName: inv.customer?.name || null,
    }));

    // 7. Sales Trend (Last 7 Days, aligning with UTC dates)
    const salesTrend: SalesTrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const dStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
      const dEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

      let dayTotal = new Prisma.Decimal(0);
      for (const inv of monthInvoices) {
        if (inv.status === "cancelled" || inv.status === "void" || inv.status === "draft") continue;
        if (inv.type !== "sales") continue;

        const invTime = inv.invoiceDate.getTime();
        if (invTime >= dStart.getTime() && invTime <= dEnd.getTime()) {
          dayTotal = dayTotal.add(inv.grandTotal);
        }
      }

      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
      salesTrend.push({
        date: label,
        total: dayTotal.toString(),
      });
    }

    return {
      kpis: {
        todaysSales: todaysSales.toString(),
        monthSales: monthSales.toString(),
        outstanding: outstanding.toString(),
        lowStockCount,
      },
      metalRates: metalRatesList,
      recentInvoices,
      salesTrend,
    };
  });
}
