import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { PaymentCreateSchema } from "@/lib/billing/validation";
import { Prisma, PaymentMethod, PaymentStatus } from "@prisma/client";

export interface SerializedPayment {
  id: string;
  invoiceId: string | null;
  customerId: string | null;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNo: string | null;
  exchangeMetalWeight: string | null;
  exchangeMetalValue: string | null;
  paidAt: string;
  receivedBy: string | null;
  createdAt: string;
}

export function serializePayment(p: Prisma.PaymentGetPayload<typeof paymentSelect>): SerializedPayment {
  return {
    ...p,
    amount: p.amount.toString(),
    exchangeMetalWeight: p.exchangeMetalWeight ? p.exchangeMetalWeight.toString() : null,
    exchangeMetalValue: p.exchangeMetalValue ? p.exchangeMetalValue.toString() : null,
    paidAt: p.paidAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

const paymentSelect = Prisma.validator<Prisma.PaymentDefaultArgs>()({
  select: {
    id: true,
    invoiceId: true,
    customerId: true,
    amount: true,
    method: true,
    status: true,
    referenceNo: true,
    exchangeMetalWeight: true,
    exchangeMetalValue: true,
    paidAt: true,
    receivedBy: true,
    createdAt: true,
  }
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("invoice:read");
    const { id } = await params;

    return await runWithTenant(session, async () => {
      const payments = await prisma.payment.findMany({
        where: { invoiceId: id },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ data: payments.map(serializePayment) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/invoices/[id]/payments error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("payment:record");
    const { id } = await params;
    const jsonBody = await request.json();
    const input = PaymentCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      if (invoice.status === "cancelled" || invoice.status === "draft") {
        return NextResponse.json(
          { error: `Cannot record payment on a ${invoice.status} invoice.` },
          { status: 400 }
        );
      }

      const payAmt = new Prisma.Decimal(input.amount);
      if (payAmt.greaterThan(invoice.balanceDue)) {
        return NextResponse.json(
          { error: `Payment amount (${payAmt.toString()}) exceeds outstanding balance due (${invoice.balanceDue.toString()}).` },
          { status: 400 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create the payment row
        const payment = await tx.payment.create({
          data: {
            tenantId: session.tenantId,
            invoiceId: id,
            customerId: invoice.customerId,
            amount: payAmt,
            method: input.method as PaymentMethod,
            status: "completed" as PaymentStatus,
            referenceNo: input.referenceNo || null,
            exchangeMetalWeight: input.exchangeMetalWeight ? new Prisma.Decimal(input.exchangeMetalWeight) : null,
            exchangeMetalValue: input.exchangeMetalValue ? new Prisma.Decimal(input.exchangeMetalValue) : null,
            paidAt: input.paidAt,
            receivedBy: session.userId,
          },
        });

        // Recompute invoice paid / balance due
        const newAmountPaid = invoice.amountPaid.add(payAmt);
        const newBalanceDue = invoice.grandTotal.sub(newAmountPaid);

        let newStatus = invoice.status;
        if (newAmountPaid.greaterThanOrEqualTo(invoice.grandTotal)) {
          newStatus = "paid";
        } else if (newAmountPaid.greaterThan(0)) {
          newStatus = "partially_paid";
        }

        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newStatus as any,
          },
        });

        // Write AuditLog
        await tx.auditLog.create({
          data: {
            tenantId: session.tenantId,
            actorUserId: session.userId,
            action: "create",
            entityType: "Payment",
            entityId: payment.id,
            after: JSON.stringify(serializePayment(payment)),
          },
        });

        return { payment, updatedInvoice };
      });

      return NextResponse.json({
        data: {
          payment: serializePayment(result.payment),
          invoiceStatus: result.updatedInvoice.status,
          balanceDue: result.updatedInvoice.balanceDue.toString(),
        }
      });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/invoices/[id]/payments error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
