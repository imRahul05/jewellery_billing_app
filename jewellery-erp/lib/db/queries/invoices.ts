import "server-only";
import { prisma } from "@/lib/db";
import type { Invoice, InvoiceStatus, InvoiceType } from "@prisma/client";

export interface InvoiceFilters {
  customerId?: string;
  status?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch invoices for a given tenant based on filters.
 * Excludes soft-deleted invoices.
 */
export async function getInvoicesQuery(
  tenantId: string,
  filters: InvoiceFilters = {}
): Promise<Invoice[]> {
  const { customerId, status, type, search, limit = 50, offset = 0 } = filters;

  return prisma.invoice.findMany({
    where: {
      tenantId,
      deletedAt: null,
      customerId: customerId || undefined,
      status: status && status !== "all" ? (status as InvoiceStatus) : undefined,
      type: type && type !== "all" ? (type as InvoiceType) : undefined,
      invoiceNumber: search
        ? { contains: search, mode: "insensitive" }
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
