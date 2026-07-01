import "server-only";

import { prisma } from "@/lib/db";

/**
 * Tenant-scoped repositories. Tenant identity must come from requireSession(),
 * never from request input. Add domain repositories here as features land.
 */
export function tenantScoped(tenantId: string) {
  return {
    invoice: {
      list: () =>
        prisma.invoice.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { invoiceDate: "desc" },
        }),
      byId: (id: string) =>
        prisma.invoice.findFirst({
          where: { id, tenantId, deletedAt: null },
        }),
    },
  };
}
