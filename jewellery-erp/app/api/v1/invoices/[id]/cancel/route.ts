import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { serializeInvoice } from "../../route";
import { Prisma, StockMovementType } from "@prisma/client";
import { z } from "zod";

const CancelInvoiceSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:cancel");
    const { id } = await params;
    const jsonBody = await request.json();
    const { reason } = CancelInvoiceSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          payments: true,
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (invoice.status === "cancelled") {
        return NextResponse.json({ error: "Invoice is already cancelled." }, { status: 400 });
      }

      // Perform cancellation transaction reversing stock deductions
      const cancelledInvoice = await prisma.$transaction(async (tx) => {
        // Reverse inventory stock if any
        for (const line of invoice.lineItems) {
          if (line.inventoryItemId) {
            // Restore inventory item back to in_stock
            await tx.inventoryItem.update({
              where: { id: line.inventoryItemId },
              data: { status: "in_stock" },
            });

            // Create reverse StockMovement
            await tx.stockMovement.create({
              data: {
                tenantId: session.tenantId,
                inventoryItemId: line.inventoryItemId,
                type: "return_in" as StockMovementType,
                weight: line.netWeight,
                quantity: line.quantity,
                referenceType: "Invoice",
                referenceId: invoice.id,
              },
            });
          }
        }

        // Set status to cancelled and balance due to 0
        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            status: "cancelled",
            balanceDue: new Prisma.Decimal(0.0),
          },
          include: {
            lineItems: true,
            payments: true,
          },
        });

        // Write AuditLog with reason
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "soft_delete", // soft delete indicates cancellation
            entityType: "Invoice",
            entityId: id,
            before: JSON.stringify(serializeInvoice(invoice)),
            after: JSON.stringify({
              ...serializeInvoice(updatedInvoice),
              cancelReason: reason,
            }),
          },
        });

        return updatedInvoice;
      });

      return NextResponse.json({ data: serializeInvoice(cancelledInvoice) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/invoices/[id]/cancel error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
