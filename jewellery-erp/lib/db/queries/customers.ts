import "server-only";
import { prisma } from "@/lib/db";
import type { Customer } from "@prisma/client";

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
}
