import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { serializeInvoice } from "../route";
import { InvoiceCreateSchema } from "@/lib/billing/validation";
import { calculateInvoice, type LineItemInput } from "@/lib/billing/calculator";
import { Prisma, MetalType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:read");
    const { id } = await params;

    return await runWithTenant(session, async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          lineItems: true,
          customer: true,
          payments: true,
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeInvoice(invoice) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/invoices/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:update");
    const { id } = await params;
    const jsonBody = await request.json();
    const input = InvoiceCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const existing = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (existing.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft invoices can be updated. Finalized invoices are immutable." },
          { status: 409 }
        );
      }

      // Resolve tenant settings to get seller state code
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
      }

      const sellerStateCode = tenant.gstin ? tenant.gstin.substring(0, 2) : "27";

      // Resolve rates
      const resolvedLinesInput: LineItemInput[] = [];
      for (const line of input.lines) {
        let metalRateId: string | null = null;
        const resolvedRate = new Prisma.Decimal(line.metalRatePerGram);

        if (line.materialType === "gold" || line.materialType === "silver" || line.materialType === "platinum") {
          const rateRow = await prisma.metalRate.findFirst({
            where: {
              metalType: line.materialType as MetalType,
              purityFineness: new Prisma.Decimal(line.purity),
              rateDate: {
                lte: input.invoiceDate,
              },
            },
            orderBy: { rateDate: "desc" },
          });

          if (rateRow) {
            metalRateId = rateRow.id;
          }
        }

        resolvedLinesInput.push({
          ...line,
          metalRateId,
          metalRatePerGram: resolvedRate,
          sellerStateCode,
          placeOfSupplyStateCode: input.placeOfSupply,
        });
      }

      // Old gold value
      let oldGoldValue = new Prisma.Decimal(0);
      if (input.oldGoldExchange) {
        const og = input.oldGoldExchange;
        const netWeight = new Prisma.Decimal(og.netWeight);
        const purityRate = new Prisma.Decimal(og.purityRate);
        const deductionPercent = new Prisma.Decimal(og.deductionPercent);
        const multiplier = new Prisma.Decimal(1).sub(deductionPercent.div(100));
        oldGoldValue = netWeight.mul(purityRate).mul(multiplier).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      }

      const calcResult = calculateInvoice(
        resolvedLinesInput,
        input.invoiceDiscountType,
        input.invoiceDiscountValue,
        oldGoldValue
      );

      const updated = await prisma.$transaction(async (tx) => {
        // Delete existing lines first
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: id },
        });

        // Delete previous exchange payments if any
        await tx.payment.deleteMany({
          where: {
            invoiceId: id,
            method: "gold_exchange",
          },
        });

        // Re-create old gold payment if provided
        if (input.oldGoldExchange) {
          await tx.payment.create({
            data: {
              tenantId: session.tenantId,
              invoiceId: id,
              customerId: input.customerId || null,
              amount: oldGoldValue,
              method: "gold_exchange",
              status: "completed",
              exchangeMetalWeight: new Prisma.Decimal(input.oldGoldExchange.netWeight),
              exchangeMetalValue: oldGoldValue,
              receivedBy: session.userId,
            },
          });
        }

        // Invalidate cached PDF
        await tx.fileAsset.deleteMany({
          where: {
            tenantId: session.tenantId,
            purpose: "invoice_pdf",
            r2Key: `${session.tenantId}/invoices/${id}.pdf`,
          },
        });

        // Update main invoice
        const inv = await tx.invoice.update({
          where: { id },
          data: {
            customerId: input.customerId || null,
            supplierId: input.supplierId || null,
            templateId: input.templateId || null,
            relatedInvoiceId: input.relatedInvoiceId || null,
            invoiceDate: input.invoiceDate,
            dueDate: input.dueDate || null,
            placeOfSupply: input.placeOfSupply,
            isIgst: calcResult.lines[0]?.isIgst || false,
            subtotal: calcResult.subTotalTaxable,
            makingChargesTotal: calcResult.lines.reduce((sum, l) => sum.add(l.makingCharges), new Prisma.Decimal(0)),
            discountTotal: calcResult.lines.reduce((sum, l) => sum.add(l.lineDiscount), new Prisma.Decimal(0)),
            cgstTotal: calcResult.totalCgst,
            sgstTotal: calcResult.totalSgst,
            igstTotal: calcResult.totalIgst,
            roundOff: calcResult.roundOff,
            grandTotal: calcResult.grandTotal,
            amountPaid: new Prisma.Decimal(0.0),
            balanceDue: calcResult.grandTotal,
            notes: input.notes || null,
            lineItems: {
              create: calcResult.lines.map((l, index) => {
                const lineInput = resolvedLinesInput[index];
                return {
                  tenantId: session.tenantId,
                  productId: lineInput.productId || null,
                  inventoryItemId: lineInput.inventoryItemId || null,
                  hsnCodeId: lineInput.hsnCodeId || null,
                  metalRateId: lineInput.metalRateId || null,
                  description: lineInput.description || "",
                  metalType: lineInput.materialType as MetalType,
                  purityFineness: new Prisma.Decimal(lineInput.purity),
                  karat: lineInput.karat || null,
                  grossWeight: new Prisma.Decimal(lineInput.grossWeight),
                  netWeight: l.netWeight,
                  quantity: lineInput.quantity || 1,
                  ratePerGram: new Prisma.Decimal(lineInput.metalRatePerGram),
                  metalValue: l.metalValue,
                  makingCharge: l.makingCharges,
                  stoneCharge: l.stoneCharges,
                  discount: l.lineDiscount,
                  taxableValue: l.taxableValue,
                  cgstAmount: l.cgst,
                  sgstAmount: l.sgst,
                  igstAmount: l.igst,
                  lineTotal: l.lineTotal,
                };
              }) as Prisma.InvoiceLineItemUncheckedCreateWithoutInvoiceInput[],
            },
          },
          include: {
            lineItems: true,
            payments: true,
          },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "update",
            entityType: "Invoice",
            entityId: id,
            before: JSON.stringify(serializeInvoice(existing)),
            after: JSON.stringify(serializeInvoice(inv)),
          },
        });

        return inv;
      });

      return NextResponse.json({ data: serializeInvoice(updated) });
    });
  } catch (err: unknown) {
    console.error("PUT /api/v1/invoices/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:update"); // delete draft is allowed under update scope
    const { id } = await params;

    return await runWithTenant(session, async () => {
      const existing = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (existing.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft invoices can be discarded." },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Line items cascading delete
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: id },
        });

        // Payments delete
        await tx.payment.deleteMany({
          where: { invoiceId: id },
        });

        // Invoice delete
        await tx.invoice.delete({
          where: { id },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "delete",
            entityType: "Invoice",
            entityId: id,
            before: JSON.stringify(serializeInvoice(existing)),
          },
        });
      });

      return NextResponse.json({ success: true });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/invoices/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
