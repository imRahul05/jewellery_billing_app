import "server-only";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

/**
 * Retrieves the non-deleted roles defined for a given tenant.
 */
export async function getTenantRolesQuery(tenantId: string): Promise<Role[]> {
  return prisma.role.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { name: "asc" },
  });
}
