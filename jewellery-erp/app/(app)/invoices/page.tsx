import { withTenant } from "@/lib/auth/with-tenant";
import { authorize } from "@/lib/rbac/authorize";
import { getInvoicesQuery } from "@/lib/db/queries/invoices";
import { InvoicesClientWrapper, type SerializedInvoice } from "./_components/invoices-client-wrapper";

export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<{
    status?: string;
    type?: string;
    search?: string;
  }>;
}

export default async function InvoicesListPage({ searchParams }: InvoicesPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;

  return withTenant(async (ctx) => {
    // 1. Authorize view permission
    await authorize("invoice:read");

    // 2. Fetch list of invoices from database via DAL query
    const invoices = await getInvoicesQuery(ctx.tenantId, {
      status: params.status || undefined,
      type: params.type || undefined,
      search: params.search || undefined,
    });

    // 3. Serialize Prisma decimal/date fields for safe transit to Client Component
    const serializedInvoices: SerializedInvoice[] = invoices.map((inv) => ({
      id: inv.id,
      tenantId: inv.tenantId,
      invoiceNumber: inv.invoiceNumber,
      type: inv.type,
      status: inv.status,
      customerId: inv.customerId,
      supplierId: inv.supplierId,
      templateId: inv.templateId,
      relatedInvoiceId: inv.relatedInvoiceId,
      invoiceDate: inv.invoiceDate.toISOString().split("T")[0],
      dueDate: inv.dueDate ? inv.dueDate.toISOString().split("T")[0] : null,
      placeOfSupply: inv.placeOfSupply,
      isIgst: inv.isIgst,
      subtotal: inv.subtotal.toString(),
      makingChargesTotal: inv.makingChargesTotal.toString(),
      discountTotal: inv.discountTotal.toString(),
      cgstTotal: inv.cgstTotal.toString(),
      sgstTotal: inv.sgstTotal.toString(),
      igstTotal: inv.igstTotal.toString(),
      roundOff: inv.roundOff.toString(),
      grandTotal: inv.grandTotal.toString(),
      amountPaid: inv.amountPaid.toString(),
      balanceDue: inv.balanceDue.toString(),
      notes: inv.notes,
      issuedBy: inv.issuedBy,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));

    return <InvoicesClientWrapper initialInvoices={serializedInvoices} />;
  });
}
