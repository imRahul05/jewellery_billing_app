import "server-only";
import { prismaAdmin } from "@/lib/db";

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalInvoices: number;
  tenantGrowth: { month: string; count: number }[];
  businessActivity: { businessName: string; activityCount: number }[];
}

/**
 * Retrieves aggregate platform-wide statistics for the Super Admin Overview page.
 *
 * Uses the unscoped `prismaAdmin` client because these are cross-tenant
 * aggregate queries. Caller MUST have already verified super-admin access.
 */
export async function getPlatformStatsQuery(): Promise<PlatformStats> {
  const [totalTenants, activeTenants, totalUsers, totalInvoices] = await Promise.all([
    prismaAdmin.tenant.count({ where: { deletedAt: null } }),
    prismaAdmin.tenant.count({ where: { isActive: true, deletedAt: null } }),
    prismaAdmin.user.count(),
    prismaAdmin.invoice.count({ where: { deletedAt: null } }),
  ]);

  // Aggregate monthly tenant growth (last 6 months)
  const tenants = await prismaAdmin.tenant.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, createdAt: true },
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

  // Aggregate business wise activity (last 30 days) - DB friendly query
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeLogsGrouped = await prismaAdmin.auditLog.groupBy({
    by: ["tenantId"],
    where: {
      occurredAt: { gte: thirtyDaysAgo },
    },
    _count: {
      id: true,
    },
  });

  const tenantMap = new Map<string, string>();
  for (const t of tenants) {
    tenantMap.set(t.id, t.name);
  }

  const businessActivity = activeLogsGrouped
    .map((group) => ({
      businessName: group.tenantId ? (tenantMap.get(group.tenantId) ?? "Unknown Tenant") : "Platform / Global",
      activityCount: group._count.id,
    }))
    .sort((a, b) => b.activityCount - a.activityCount)
    .slice(0, 10);

  return {
    totalTenants,
    activeTenants,
    totalUsers,
    totalInvoices,
    tenantGrowth,
    businessActivity,
  };
}
