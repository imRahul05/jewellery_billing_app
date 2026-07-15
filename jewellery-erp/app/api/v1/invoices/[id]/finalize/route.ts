import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { serializeInvoice } from "../../route";
import { calculateInvoice } from "@/lib/billing/calculator";
import { assignInvoiceNumber } from "@/lib/billing/numbering";
import { Prisma, StockMovementType, InvoiceStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Both draft creation and finalization are gated by "invoice:create" in seeded permissions
    const session = await authorize("invoice:create");
    const { id } = await params;

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

      if (invoice.status !== "draft") {
        return NextResponse.json(
          { error: `Invoice is already ${invoice.status}.` },
          { status: 400 }
        );
      }

      // Resolve tenant state codes
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        include: { settings: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
      }

      const sellerStateCode = tenant.gstin ? tenant.gstin.substring(0, 2) : "27";

      // 1. Re-validate all line items & 2. Verify effective MetalRates exist
      const lineInputs = [];
      for (const line of invoice.lineItems) {
        let metalRatePerGram = line.ratePerGram;
        let metalRateId = line.metalRateId;

        // If rate id is missing, attempt lookup
        if ((line.metalType === "gold" || line.metalType === "silver" || line.metalType === "platinum") && !metalRateId) {
          const rateRow = await prisma.metalRate.findFirst({
            where: {
              metalType: line.metalType,
              purityFineness: line.purityFineness || undefined,
              rateDate: {
                lte: invoice.invoiceDate,
              },
            },
            orderBy: { rateDate: "desc" },
          });

          if (!rateRow) {
            return NextResponse.json(
              { error: `No active metal rate found for ${line.metalType} at purity ${line.purityFineness} on or before ${invoice.invoiceDate.toISOString().split("T")[0]}` },
              { status: 400 }
            );
          }
          metalRateId = rateRow.id;
          metalRatePerGram = rateRow.ratePerGram;
        }

        // Parse line inputs to feed the calculator
        lineInputs.push({
          hsnCode: line.hsnCodeId || undefined,
          grossWeight: line.grossWeight,
          stoneWeight: line.grossWeight.sub(line.netWeight), // stone = gross - net
          purity: line.purityFineness || new Prisma.Decimal(0),
          metalRatePerGram,
          makingChargeType: "PER_GRAM" as const, // Draft lines store resolved making charge. Let's assume PER_GRAM with making charge value.
          makingChargeValue: line.makingCharge.div(line.netWeight.greaterThan(0) ? line.netWeight : 1), // backward derive value
          wastageType: "NONE" as const, // resolved draft already has wastage in netWeight/metalValue
          wastageValue: new Prisma.Decimal(0),
          stoneChargeType: "FLAT" as const,
          stoneCarat: new Prisma.Decimal(0),
          stonePieces: 0,
          stoneRate: line.stoneCharge,
          hallmarkCharges: new Prisma.Decimal(0),
          otherCharges: new Prisma.Decimal(0),
          lineDiscountType: "AMOUNT" as const,
          lineDiscountValue: line.discount,
          gstRatePercent: new Prisma.Decimal(3.00), // Default composite rate
          sellerStateCode,
          placeOfSupplyStateCode: invoice.placeOfSupply || sellerStateCode,
        });
      }

      // If old gold payments exist, sum them up
      const oldGoldExchangePayments = invoice.payments.filter(p => p.method === "gold_exchange");
      const oldGoldValue = oldGoldExchangePayments.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));

      // 3. Recompute all totals server-side
      const calcResult = calculateInvoice(
        lineInputs,
        "NONE", // Invoice-level discount already apportioned to draft line items
        0,
        oldGoldValue
      );

      // Determine series type
      const prefix = tenant.settings?.invoicePrefix || "INV";

      // 4. Run database finalization transaction
      const finalizedInvoice = await prisma.$transaction(async (tx) => {
        // a. Assign invoice number concurrency-safely
        const invoiceNumber = await assignInvoiceNumber(tx, session.tenantId, prefix, invoice.invoiceDate);

        // Verify and deduct inventory items
        for (const line of invoice.lineItems) {
          if (line.inventoryItemId) {
            const invItem = await tx.inventoryItem.findUnique({
              where: { id: line.inventoryItemId },
            });

            if (!invItem || invItem.status !== "in_stock") {
              throw new Error(`Inventory item ${line.inventoryItemId} is not in stock.`);
            }

            // Update status to sold
            await tx.inventoryItem.update({
              where: { id: line.inventoryItemId },
              data: { status: "sold" },
            });

            // Create StockMovement
            await tx.stockMovement.create({
              data: {
                tenantId: session.tenantId,
                inventoryItemId: line.inventoryItemId,
                type: "sale_out" as StockMovementType,
                weight: line.netWeight,
                quantity: line.quantity,
                referenceType: "Invoice",
                referenceId: invoice.id,
              },
            });
          }
        }

        // Calculate amount paid (excluding gold_exchange payments)
        const nonGoldPaymentsSum = invoice.payments
          .filter((p) => p.method !== "gold_exchange")
          .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));

        const balanceDue = calcResult.grandTotal.sub(nonGoldPaymentsSum);
        let finalStatus = "issued";
        if (nonGoldPaymentsSum.greaterThan(0)) {
          finalStatus = nonGoldPaymentsSum.greaterThanOrEqualTo(calcResult.grandTotal) ? "paid" : "partially_paid";
        } else if (calcResult.grandTotal.equals(0)) {
          finalStatus = "paid";
        }

        // Invalidate cached PDF
        await tx.fileAsset.deleteMany({
          where: {
            tenantId: session.tenantId,
            purpose: "invoice_pdf",
            r2Key: `${session.tenantId}/invoices/${id}.pdf`,
          },
        });

        // b. Update invoice status to finalized/issued
        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            invoiceNumber,
            status: finalStatus as InvoiceStatus,
            subtotal: calcResult.subTotalTaxable,
            cgstTotal: calcResult.totalCgst,
            sgstTotal: calcResult.totalSgst,
            igstTotal: calcResult.totalIgst,
            roundOff: calcResult.roundOff,
            grandTotal: calcResult.grandTotal,
            amountPaid: nonGoldPaymentsSum,
            balanceDue,
          },
          include: {
            lineItems: true,
            payments: true,
          },
        });

        // d. Write AuditLog
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "update",
            entityType: "Invoice",
            entityId: id,
            before: JSON.stringify(serializeInvoice(invoice)),
            after: JSON.stringify(serializeInvoice(updatedInvoice)),
          },
        });

        return updatedInvoice;
      });

      // Trigger low-stock check for all products in the invoice
      const { checkAndTriggerLowStock } = await import("@/lib/notifications/dispatcher");
      for (const line of invoice.lineItems) {
        if (line.productId) {
          await checkAndTriggerLowStock(session.tenantId, line.productId);
        }
      }

      return NextResponse.json({ data: serializeInvoice(finalizedInvoice) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/invoices/[id]/finalize error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
