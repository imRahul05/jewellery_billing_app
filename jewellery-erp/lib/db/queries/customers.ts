import "server-only";
import { prisma } from "@/lib/db";
import type { Customer } from "@prisma/client";
import { cacheLife, cacheTag } from "next/cache";
import { runWithTenant } from "@/lib/db/tenant-context";

export interface CustomerFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch active customers for a given tenant based on filters.
 * Excludes soft-deleted records.
 */
export async function getCustomersQuery(
  tenantId: string,
  filters: CustomerFilters = {}
): Promise<Customer[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`customers-${tenantId}`);

  return runWithTenant({ tenantId, userId: "system-cache", isSuperAdmin: false }, async () => {
    const { search, limit = 50, offset = 0 } = filters;

    return prisma.customer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    });
  });
}


