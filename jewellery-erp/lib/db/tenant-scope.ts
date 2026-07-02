import "server-only";

import { prisma } from "@/lib/db";

/**
 * Tenant scoping is now enforced globally by the Prisma `$extends` interceptor
 * in `lib/db.ts` (reads filtered, writes stamped, spoofs rejected) using the
 * active `AsyncLocalStorage` tenant context. Call sites bind that context via
 * `withTenant()` (see `lib/auth/with-tenant.ts`).
 *
 * This module remains only as a convenience surface for common reads; it no
 * longer takes a `tenantId` argument because the extension injects it. Add
 * domain repositories here as features land.
 */
export const repos = {
  invoice: {
    list: () =>
      prisma.invoice.findMany({
        where: { deletedAt: null },
        orderBy: { invoiceDate: "desc" },
      }),
    byId: (id: string) =>
      prisma.invoice.findFirst({ where: { id, deletedAt: null } }),
  },
};
