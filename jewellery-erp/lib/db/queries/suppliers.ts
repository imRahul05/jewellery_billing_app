import "server-only";
import { prisma } from "@/lib/db";
import type { Supplier } from "@prisma/client";

export interface SupplierFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch active suppliers for a given tenant based on filters.
 * Excludes soft-deleted records.
 */
export async function getSuppliersQuery(
  tenantId: string,
  filters: SupplierFilters = {}
): Promise<Supplier[]> {
  const { search, limit = 50, offset = 0 } = filters;

  return prisma.supplier.findMany({
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
