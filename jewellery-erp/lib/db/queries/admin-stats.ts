import "server-only";
import { prisma } from "@/lib/db";

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalInvoices: number;
  tenantGrowth: { month: string; count: number }[];
}

/**
 * Retrieves aggregate platform-wide statistics for the Super Admin Overview page.
 */
export async function getPlatformStatsQuery(): Promise<PlatformStats> {
  const [totalTenants, activeTenants, totalUsers, totalInvoices] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { isActive: true, deletedAt: null } }),
    prisma.user.count(),
    prisma.invoice.count({ where: { deletedAt: null } }),
  ]);

  // Aggregate monthly tenant growth (last 6 months)
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthMap = new Map<string, number>();
  for (const t of tenants) {
    const month = t.createdAt.toLocaleString(undefined, { month: "short", year: "2-digit" });
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  const tenantGrowth = Array.from(monthMap.entries()).map(([month, count]) => ({
    month,
    count,
  })).slice(-6); // Last 6 months

  return {
    totalTenants,
    activeTenants,
    totalUsers,
    totalInvoices,
    tenantGrowth,
  };
}
