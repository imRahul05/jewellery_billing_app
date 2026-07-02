import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { CustomerLedgerEntry } from "@/lib/api/customer.api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("customer:read");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const customer = await prisma.customer.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
        select: { id: true, openingBalance: true },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      // Fetch all invoices and payments for running balance calculations
      const [invoices, payments] = await Promise.all([
        prisma.invoice.findMany({
          where: { customerId: resolvedParams.id, deletedAt: null },
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            grandTotal: true,
            createdAt: true,
          },
          orderBy: { invoiceDate: "asc" },
        }),
        prisma.payment.findMany({
          where: { customerId: resolvedParams.id, status: "completed" },
          select: {
            id: true,
            referenceNo: true,
            amount: true,
            method: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { paidAt: "asc" },
        }),
      ]);

      let runningBalance = new Prisma.Decimal(customer.openingBalance);

      // Combine invoices and payments into a uniform ledger entry array
      interface RawLedgerItem {
        id: string;
        type: "invoice" | "payment";
        date: Date;
        amount: Prisma.Decimal;
        description: string;
        createdAt: Date;
      }

      const rawItems: RawLedgerItem[] = [
        ...invoices.map((inv) => ({
          id: inv.id,
          type: "invoice" as const,
          date: inv.invoiceDate,
          amount: new Prisma.Decimal(inv.grandTotal),
          description: `Invoice #${inv.invoiceNumber}`,
          createdAt: inv.createdAt,
        })),
        ...payments.map((pmt) => ({
          id: pmt.id,
          type: "payment" as const,
          date: pmt.paidAt,
          amount: new Prisma.Decimal(pmt.amount).negated(), // payment reduces due
          description: `Payment via ${pmt.method.toUpperCase()} ${
            pmt.referenceNo ? `(${pmt.referenceNo})` : ""
          }`,
          createdAt: pmt.createdAt,
        })),
      ];

      // Sort chronologically
      rawItems.sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const ledgerEntries: CustomerLedgerEntry[] = rawItems.map((item) => {
        runningBalance = runningBalance.add(item.amount);
        return {
          id: item.id,
          type: item.type,
          date: item.date.toISOString(),
          amount: item.amount.toString(),
          description: item.description,
          balanceAfter: runningBalance.toString(),
        };
      });

      return NextResponse.json({ data: ledgerEntries });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/customers/[id]/ledger error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
