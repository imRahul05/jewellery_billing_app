import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { serializeInvoice } from "../../route";
import { assignInvoiceNumber } from "@/lib/billing/numbering";
import { Prisma, StockMovementType } from "@prisma/client";
import { z } from "zod";

const ReturnInvoiceSchema = z.object({
  reason: z.string().min(1, "Return reason is required"),
  lines: z.array(
    z.object({
      lineItemId: z.string().cuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Return must contain at least one line item"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:cancel"); // Gated by cancel/return permission
    const { id: originalInvoiceId } = await params;
    const jsonBody = await request.json();
    const { reason, lines } = ReturnInvoiceSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const originalInvoice = await prisma.invoice.findUnique({
        where: { id: originalInvoiceId },
        include: {
          lineItems: true,
          payments: true,
        },
      });

      if (!originalInvoice) {
        return NextResponse.json({ error: "Original invoice not found." }, { status: 404 });
      }

      if (originalInvoice.status !== "issued" && originalInvoice.status !== "paid" && originalInvoice.status !== "partially_paid") {
        return NextResponse.json(
          { error: `Cannot return items from a ${originalInvoice.status} invoice.` },
          { status: 400 }
        );
      }

      // Fetch all previously issued returns for this invoice
      const previousReturns = await prisma.invoice.findMany({
        where: {
          relatedInvoiceId: originalInvoiceId,
          type: "return",
          status: { not: "cancelled" },
        },
        include: { lineItems: true },
      });

      // Map to track already returned quantities per original line item description/productId
      const alreadyReturned = new Map<string, number>();
      for (const retInv of previousReturns) {
        for (const retLine of retInv.lineItems) {
          const key = retLine.description; // using description as matching key
          alreadyReturned.set(key, (alreadyReturned.get(key) || 0) + retLine.quantity);
        }
      }

      // Perform return transaction
      const returnInvoice = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.findUnique({
          where: { id: session.tenantId },
          include: { settings: true },
        });

        if (!tenant) {
          throw new Error("Tenant not found.");
        }

        const settingsJson = (tenant.settings?.settingsJson || {}) as Record<string, unknown>;
        const cnPrefix = (settingsJson.creditNotePrefix as string) || "CN";
        const returnDate = new Date();

        // Assign credit note number concurrency-safely
        const cnNumber = await assignInvoiceNumber(tx, session.tenantId, cnPrefix, returnDate);

        let subtotal = new Prisma.Decimal(0);
        let cgstTotal = new Prisma.Decimal(0);
        let sgstTotal = new Prisma.Decimal(0);
        let igstTotal = new Prisma.Decimal(0);

        const returnLinesData = [];

        for (const returnInput of lines) {
          const originalLine = originalInvoice.lineItems.find(l => l.id === returnInput.lineItemId);
          if (!originalLine) {
            throw new Error(`Line item ${returnInput.lineItemId} not found on original invoice.`);
          }

          const key = originalLine.description;
          const previouslyReturnedQty = alreadyReturned.get(key) || 0;
          const remainingReturnable = originalLine.quantity - previouslyReturnedQty;

          if (returnInput.quantity > remainingReturnable) {
            throw new Error(
              `Cannot return quantity ${returnInput.quantity} for "${originalLine.description}". Only ${remainingReturnable} remaining returnable.`
            );
          }

          // Calculate return values proportionally
          const ratio = new Prisma.Decimal(returnInput.quantity).div(originalLine.quantity);
          const lineTaxableValue = originalLine.taxableValue.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const lineCgst = originalLine.cgstAmount.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const lineSgst = originalLine.sgstAmount.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const lineIgst = originalLine.igstAmount.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const lineGstSum = lineCgst.add(lineSgst).add(lineIgst);
          const lineTotal = lineTaxableValue.add(lineGstSum);

          subtotal = subtotal.add(lineTaxableValue);
          cgstTotal = cgstTotal.add(lineCgst);
          sgstTotal = sgstTotal.add(lineSgst);
          igstTotal = igstTotal.add(lineIgst);

          returnLinesData.push({
            tenantId: session.tenantId,
            productId: originalLine.productId,
            inventoryItemId: originalLine.inventoryItemId,
            hsnCodeId: originalLine.hsnCodeId,
            metalRateId: originalLine.metalRateId,
            taxRateId: originalLine.taxRateId,
            description: `[RETURN] ${originalLine.description}`,
            metalType: originalLine.metalType,
            purityFineness: originalLine.purityFineness,
            karat: originalLine.karat,
            grossWeight: originalLine.grossWeight.mul(ratio),
            netWeight: originalLine.netWeight.mul(ratio),
            quantity: returnInput.quantity,
            ratePerGram: originalLine.ratePerGram,
            metalValue: originalLine.metalValue.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            makingCharge: originalLine.makingCharge.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            stoneCharge: originalLine.stoneCharge.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            discount: originalLine.discount.mul(ratio).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            taxableValue: lineTaxableValue,
            cgstAmount: lineCgst,
            sgstAmount: lineSgst,
            igstAmount: lineIgst,
            lineTotal,
          });

          // Restore inventory item back to stock
          if (originalLine.inventoryItemId) {
            await tx.inventoryItem.update({
              where: { id: originalLine.inventoryItemId },
              data: { status: "in_stock" },
            });

            // Create return StockMovement
            await tx.stockMovement.create({
              data: {
                tenantId: session.tenantId,
                inventoryItemId: originalLine.inventoryItemId,
                type: "return_in" as StockMovementType,
                weight: originalLine.netWeight.mul(ratio),
                quantity: returnInput.quantity,
                referenceType: "Invoice",
                referenceId: originalInvoiceId,
              },
            });
          }
        }

        const totalTax = cgstTotal.add(sgstTotal).add(igstTotal);
        const grandTotalBeforeRound = subtotal.add(totalTax);
        const grandTotal = grandTotalBeforeRound.round();
        const roundOff = grandTotal.sub(grandTotalBeforeRound);



        // Create return credit note invoice
        const retInvoice = await tx.invoice.create({
          data: {
            tenantId: session.tenantId,
            invoiceNumber: cnNumber,
            type: "return",
            status: "issued",
            customerId: originalInvoice.customerId,
            relatedInvoiceId: originalInvoiceId,
            invoiceDate: returnDate,
            placeOfSupply: originalInvoice.placeOfSupply,
            isIgst: originalInvoice.isIgst,
            subtotal,
            makingChargesTotal: returnLinesData.reduce((sum, l) => sum.add(l.makingCharge), new Prisma.Decimal(0)),
            discountTotal: returnLinesData.reduce((sum, l) => sum.add(l.discount), new Prisma.Decimal(0)),
            cgstTotal,
            sgstTotal,
            igstTotal,
            roundOff,
            grandTotal,
            amountPaid: grandTotal, // credit note represents fully processed returned value
            balanceDue: new Prisma.Decimal(0.0),
            notes: `Credit note for return: ${reason}`,
            issuedBy: session.userId,
            lineItems: {
              create: returnLinesData,
            },
          },
          include: {
            lineItems: true,
          },
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "create",
            entityType: "Invoice",
            entityId: retInvoice.id,
            after: JSON.stringify(serializeInvoice(retInvoice)),
          },
        });

        return retInvoice;
      });

      return NextResponse.json({ data: serializeInvoice(returnInvoice) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/invoices/[id]/return error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
