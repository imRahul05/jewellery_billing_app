import { describe, test, expect, beforeAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";
import { Prisma, MetalType } from "@prisma/client";

// Mock requiring session using the active tenant context
vi.mock("@/lib/auth/session", () => {
  return {
    requireSession: async () => {
      const { peekTenantContext } = await import("@/lib/db/tenant-context");
      const ctx = peekTenantContext();
      if (!ctx) {
        throw new Error("No tenant context bound in requireSession mock.");
      }
      return {
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        membershipId: "mock-membership-id",
        isSuperAdmin: ctx.isSuperAdmin,
      };
    },
  };
});

describe("Invoice Finalize with Payments Integration Tests", () => {
  let tenantId: string;
  let ownerUserId: string;
  let customerId: string;

  beforeAll(async () => {
    // Seed permissions
    await prisma.permission.createMany({
      data: [
        { key: "invoice:read", module: "billing", description: "View invoices" },
        { key: "invoice:create", module: "billing", description: "Create invoices" },
        { key: "invoice:update", module: "billing", description: "Edit invoices" },
        { key: "payment:record", module: "billing", description: "Record payments" },
        { key: "customer:read", module: "customers", description: "View customers" },
        { key: "settings:read", module: "settings", description: "View settings" },
      ],
      skipDuplicates: true,
    });

    const rand = Math.floor(Math.random() * 89999) + 10000;
    const tenant = await prisma.tenant.create({
      data: {
        name: `Finalize Payment Store ${rand}`,
        slug: `finalize-pay-${rand}`,
        gstin: `27AAAAA${rand}Z5`,
      },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        authUserId: `auth-fin-${rand}`,
        email: `fin-${rand}@jeweller.com`,
        fullName: "Store Cashier",
      },
    });
    ownerUserId = user.id;

    const ownerMembership = await prisma.userTenantMembership.create({
      data: {
        tenantId,
        userId: ownerUserId,
        isActive: true,
      },
    });

    await seedTenantRoles(tenantId);
    const ownerRole = await prisma.role.findFirstOrThrow({
      where: { tenantId, name: "Business Owner" },
    });

    await prisma.userRole.create({
      data: {
        membershipId: ownerMembership.id,
        roleId: ownerRole.id,
      },
    });

    // Create a customer within tenant context
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const customer = await prisma.customer.create({
          data: {
            tenantId,
            name: "Rahul Verma",
            phone: "9876543210",
          },
        });
        customerId = customer.id;
      }
    );
  });

  test("full payment via Cash marks invoice as paid with zero balance", async () => {
    const { POST: finalizeInvoiceRoute } = await import("@/app/api/v1/invoices/[id]/finalize/route");

    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Create draft invoice
        const draft = await prisma.invoice.create({
          data: {
            tenantId,
            invoiceNumber: `DRAFT-${Date.now()}`,
            customerId,
            invoiceDate: new Date(),
            status: "draft",
            subtotal: new Prisma.Decimal(10000),
            cgstTotal: new Prisma.Decimal(150),
            sgstTotal: new Prisma.Decimal(150),
            grandTotal: new Prisma.Decimal(10300),
            balanceDue: new Prisma.Decimal(10300),
            lineItems: {
              create: [
                {
                  tenantId,
                  description: "Gold Ring",
                  metalType: MetalType.gold,
                  purityFineness: new Prisma.Decimal(0.916),
                  grossWeight: new Prisma.Decimal(2),
                  netWeight: new Prisma.Decimal(2),
                  ratePerGram: new Prisma.Decimal(5000),
                  makingCharge: new Prisma.Decimal(0),
                  stoneCharge: new Prisma.Decimal(0),
                  taxableValue: new Prisma.Decimal(10000),
                  cgstAmount: new Prisma.Decimal(150),
                  sgstAmount: new Prisma.Decimal(150),
                  lineTotal: new Prisma.Decimal(10300),
                },
              ],
            },
          },
        });

        const req = new Request(`http://localhost/api/v1/invoices/${draft.id}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initialPayments: [
              { method: "cash", amount: 10300 },
            ],
          }),
        });

        const res = await finalizeInvoiceRoute(req, { params: Promise.resolve({ id: draft.id }) });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.status).toBe("paid");
        expect(parseFloat(body.data.amountPaid)).toBe(10300);
        expect(parseFloat(body.data.balanceDue)).toBe(0);

        // Verify payment created
        const payments = await prisma.payment.findMany({ where: { invoiceId: draft.id } });
        expect(payments.length).toBe(1);
        expect(payments[0].method).toBe("cash");
        expect(payments[0].amount.toNumber()).toBe(10300);
        expect(payments[0].status).toBe("completed");
      }
    );
  }, 20000);

  test("split payment (Cash + UPI) with leftover balance marks invoice as partially_paid", async () => {
    const { POST: finalizeInvoiceRoute } = await import("@/app/api/v1/invoices/[id]/finalize/route");

    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const draft = await prisma.invoice.create({
          data: {
            tenantId,
            invoiceNumber: `DRAFT-${Date.now()}-2`,
            customerId,
            invoiceDate: new Date(),
            status: "draft",
            subtotal: new Prisma.Decimal(20000),
            cgstTotal: new Prisma.Decimal(300),
            sgstTotal: new Prisma.Decimal(300),
            grandTotal: new Prisma.Decimal(20600),
            balanceDue: new Prisma.Decimal(20600),
            lineItems: {
              create: [
                {
                  tenantId,
                  description: "Gold Chain",
                  metalType: MetalType.gold,
                  purityFineness: new Prisma.Decimal(0.916),
                  grossWeight: new Prisma.Decimal(4),
                  netWeight: new Prisma.Decimal(4),
                  ratePerGram: new Prisma.Decimal(5000),
                  makingCharge: new Prisma.Decimal(0),
                  stoneCharge: new Prisma.Decimal(0),
                  taxableValue: new Prisma.Decimal(20000),
                  cgstAmount: new Prisma.Decimal(300),
                  sgstAmount: new Prisma.Decimal(300),
                  lineTotal: new Prisma.Decimal(20600),
                },
              ],
            },
          },
        });

        const req = new Request(`http://localhost/api/v1/invoices/${draft.id}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initialPayments: [
              { method: "cash", amount: 10000 },
              { method: "upi", amount: 5000, referenceNo: "UPI-REF-9988" },
            ],
            dueDate: "2026-10-31",
          }),
        });

        const res = await finalizeInvoiceRoute(req, { params: Promise.resolve({ id: draft.id }) });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.status).toBe("partially_paid");
        expect(parseFloat(body.data.amountPaid)).toBe(15000);
        expect(parseFloat(body.data.balanceDue)).toBe(5600);

        const payments = await prisma.payment.findMany({
          where: { invoiceId: draft.id },
          orderBy: { amount: "asc" },
        });
        expect(payments.length).toBe(2);
        expect(payments[0].method).toBe("upi");
        expect(payments[0].amount.toNumber()).toBe(5000);
        expect(payments[0].referenceNo).toBe("UPI-REF-9988");
        expect(payments[1].method).toBe("cash");
        expect(payments[1].amount.toNumber()).toBe(10000);
      }
    );
  }, 20000);
});
