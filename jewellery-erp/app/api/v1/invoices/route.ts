import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { InvoiceCreateSchema } from "@/lib/billing/validation";
import { calculateInvoice, type LineItemInput } from "@/lib/billing/calculator";
import { Prisma, Invoice, InvoiceLineItem, MetalType, InvoiceStatus, InvoiceType } from "@prisma/client";
import { revalidateTag } from "next/cache";


export interface SerializedInvoiceLineItem {
  id: string;
  productId: string | null;
  inventoryItemId: string | null;
  hsnCodeId: string | null;
  metalRateId: string | null;
  taxRateId: string | null;
  description: string;
  metalType: string | null;
  purityFineness: string | null;
  karat: number | null;
  grossWeight: string;
  netWeight: string;
  quantity: number;
  ratePerGram: string;
  metalValue: string;
  makingCharge: string;
  stoneCharge: string;
  discount: string;
  taxableValue: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  lineTotal: string;
}

export interface SerializedInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customerId: string | null;
  supplierId: string | null;
  templateId: string | null;
  relatedInvoiceId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  placeOfSupply: string | null;
  isIgst: boolean;
  subtotal: string;
  makingChargesTotal: string;
  discountTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  roundOff: string;
  grandTotal: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  issuedBy: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems?: SerializedInvoiceLineItem[];
}

export function serializeInvoiceLineItem(item: InvoiceLineItem): SerializedInvoiceLineItem {
  return {
    id: item.id,
    productId: item.productId,
    inventoryItemId: item.inventoryItemId,
    hsnCodeId: item.hsnCodeId,
    metalRateId: item.metalRateId,
    taxRateId: item.taxRateId,
    description: item.description,
    metalType: item.metalType,
    purityFineness: item.purityFineness ? item.purityFineness.toString() : null,
    karat: item.karat,
    grossWeight: item.grossWeight.toString(),
    netWeight: item.netWeight.toString(),
    quantity: item.quantity,
    ratePerGram: item.ratePerGram.toString(),
    metalValue: item.metalValue.toString(),
    makingCharge: item.makingCharge.toString(),
    stoneCharge: item.stoneCharge.toString(),
    discount: item.discount.toString(),
    taxableValue: item.taxableValue.toString(),
    cgstAmount: item.cgstAmount.toString(),
    sgstAmount: item.sgstAmount.toString(),
    igstAmount: item.igstAmount.toString(),
    lineTotal: item.lineTotal.toString(),
  };
}

export function serializeInvoice(
  inv: Invoice & { lineItems?: InvoiceLineItem[] }
): SerializedInvoice {
  return {
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
    lineItems: inv.lineItems?.map(serializeInvoiceLineItem),
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:read");
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    return await runWithTenant(session, async () => {
      const invoices = await prisma.invoice.findMany({
        where: {
          deletedAt: null,
          customerId: customerId,
          status: status as InvoiceStatus,
          type: type as InvoiceType,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      });

      return NextResponse.json({ data: invoices.map(inv => serializeInvoice(inv)) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/invoices error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:create");
    const jsonBody = await request.json();
    const input = InvoiceCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      // Resolve tenant settings to get seller state code (extracted from tenant's GSTIN positions 1-2)
      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        include: { settings: true },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
      }

      const sellerStateCode = tenant.gstin ? tenant.gstin.substring(0, 2) : "27"; // Maharashtra fallback

      // Resolve MetalRates for each line where materialType is GOLD/SILVER/PLATINUM
      const resolvedLinesInput: LineItemInput[] = [];
      for (const line of input.lines) {
        let metalRateId: string | null = null;
        let resolvedRate = new Prisma.Decimal(line.metalRatePerGram);

        if (line.materialType === "gold" || line.materialType === "silver" || line.materialType === "platinum") {
          // Look up rate date closest to invoiceDate (on or before)
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
            resolvedRate = rateRow.ratePerGram;
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

      // If old gold exchange is present, calculate old gold value
      let oldGoldValue = new Prisma.Decimal(0);
      if (input.oldGoldExchange) {
        const og = input.oldGoldExchange;
        const netWeight = new Prisma.Decimal(og.netWeight);
        const purityRate = new Prisma.Decimal(og.purityRate);
        const deductionPercent = new Prisma.Decimal(og.deductionPercent);
        const multiplier = new Prisma.Decimal(1).sub(deductionPercent.div(100));
        oldGoldValue = netWeight.mul(purityRate).mul(multiplier).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      }

      // Recompute invoice using pure business logic calculator
      const calcResult = calculateInvoice(
        resolvedLinesInput,
        input.invoiceDiscountType,
        input.invoiceDiscountValue,
        oldGoldValue
      );

      // Create invoice draft inside a database transaction
      const draftInvoiceNumber = `DRAFT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            tenantId: session.tenantId,
            invoiceNumber: draftInvoiceNumber,
            type: input.type,
            status: "draft",
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
            issuedBy: session.userId,
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
          },
        });

        // If old gold was provided, record a pending gold_exchange payment row
        if (input.oldGoldExchange) {
          await tx.payment.create({
            data: {
              tenantId: session.tenantId,
              invoiceId: inv.id,
              customerId: input.customerId || null,
              amount: oldGoldValue,
              method: "gold_exchange",
              status: "completed",
              exchangeMetalWeight: new Prisma.Decimal(input.oldGoldExchange.netWeight),
              exchangeMetalValue: oldGoldValue,
              receivedBy: session.userId,
            },
          });

          // Update amount paid/balance due of the draft invoice
          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              amountPaid: oldGoldValue,
              balanceDue: inv.grandTotal.sub(oldGoldValue),
            },
          });
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "create",
            entityType: "Invoice",
            entityId: inv.id,
            after: JSON.stringify(serializeInvoice(inv)),
          },
        });

        return inv;
      });

      revalidateTag(`reports-${session.tenantId}`, { expire: 0 });

      return NextResponse.json({ data: serializeInvoice(invoice) }, { status: 201 });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/invoices error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
