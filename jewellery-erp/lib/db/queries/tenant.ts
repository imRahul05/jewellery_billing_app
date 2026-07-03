import "server-only";
import { prisma } from "@/lib/db";

export interface TenantSummary {
  id: string;
  name: string;
}

/**
 * Fetch tenant profile details by ID.
 * Excludes soft-deleted and inactive tenants.
 */
export async function getTenantByIdQuery(tenantId: string): Promise<TenantSummary> {
  return prisma.tenant.findFirstOrThrow({
    where: {
      id: tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });
}
