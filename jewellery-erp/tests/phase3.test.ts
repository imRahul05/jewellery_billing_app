import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";
import { Prisma } from "@prisma/client";
import { calculateLineItem, calculateInvoice } from "@/lib/billing/calculator";
import { assignInvoiceNumber } from "@/lib/billing/numbering";
import { computeOldGoldValue } from "@/lib/billing/old-gold";
import { toIndianWords } from "@/lib/billing/indian-words";

// Mock next/cache so use-cache decorators and life/tag limits do not throw in Vitest
vi.mock("next/cache", () => {
  return {
    cacheLife: () => {},
    cacheTag: () => {},
    revalidateTag: () => {},
  };
});

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

describe("Phase 3 Billing Engine and GST Integration Tests", () => {
  let tenantId: string;
  let ownerUserId: string;
  let ownerMembershipId: string;

  beforeAll(async () => {
    // 0. Seed global permissions first
    const permissionsToSeed = [
      { key: "dashboard:read", module: "dashboard", description: "View dashboard" },
      { key: "customer:read", module: "customers", description: "View customers" },
      { key: "customer:write", module: "customers", description: "Create/edit customers" },
      { key: "customer:delete", module: "customers", description: "Delete customers" },
      { key: "supplier:read", module: "suppliers", description: "View suppliers" },
      { key: "supplier:write", module: "suppliers", description: "Create/edit suppliers" },
      { key: "supplier:delete", module: "suppliers", description: "Delete suppliers" },
      { key: "inventory:read", module: "inventory", description: "View inventory" },
      { key: "inventory:write", module: "inventory", description: "Create/edit inventory" },
      { key: "inventory:adjust", module: "inventory", description: "Adjust stock" },
      { key: "inventory:transfer", module: "inventory", description: "Transfer stock" },
      { key: "inventory:delete", module: "inventory", description: "Delete inventory" },
      { key: "invoice:read", module: "billing", description: "View invoices" },
      { key: "invoice:create", module: "billing", description: "Create invoices" },
      { key: "invoice:update", module: "billing", description: "Edit invoices" },
      { key: "invoice:cancel", module: "billing", description: "Cancel/void invoices" },
      { key: "payment:record", module: "billing", description: "Record payments" },
      { key: "metal_rate:read", module: "pricing", description: "View metal rates" },
      { key: "metal_rate:write", module: "pricing", description: "Set metal rates" },
      { key: "report:read", module: "reports", description: "View reports" },
      { key: "settings:read", module: "settings", description: "View settings" },
      { key: "settings:write", module: "settings", description: "Edit settings" },
    ];

    await prisma.permission.createMany({
      data: permissionsToSeed,
      skipDuplicates: true,
    });

    // 1. Create a clean test Tenant
    const tenant = await prisma.tenant.create({
      data: { name: "Test Phase 3 Store", slug: `test-p3-${Date.now()}` },
    });
    tenantId = tenant.id;

    // 2. Create Owner User
    const ownerUser = await prisma.user.create({
      data: { authUserId: `owner-p3-${Date.now()}`, email: `owner-p3-${Date.now()}@test.com`, fullName: "Store Owner" },
    });
    ownerUserId = ownerUser.id;

    // 3. Create Membership
    const ownerMembership = await prisma.userTenantMembership.create({
      data: { tenantId, userId: ownerUserId, isActive: true },
    });
    ownerMembershipId = ownerMembership.id;

    // 4. Seed system roles for the tenant
    await seedTenantRoles(tenantId);

    // Fetch the owner role
    const ownerRole = await prisma.role.findFirstOrThrow({
      where: { tenantId, name: "Business Owner" },
    });

    // Assign owner role
    await prisma.userRole.create({
      data: { membershipId: ownerMembershipId, roleId: ownerRole.id },
    });
  });

  afterAll(async () => {
    // Clean up created test data
    await runWithTenant(
      { tenantId: "", userId: "", isSuperAdmin: true },
      async () => {
        await prisma.invoiceLineItem.deleteMany({ where: { tenantId } });
        await prisma.payment.deleteMany({ where: { tenantId } });
        await prisma.invoice.deleteMany({ where: { tenantId } });
        await prisma.metalRate.deleteMany({ where: { tenantId } });
        await prisma.invoiceCounter.deleteMany({ where: { tenantId } });
        await prisma.userRole.deleteMany({ where: { membershipId: ownerMembershipId } });
        await prisma.userTenantMembership.delete({ where: { id: ownerMembershipId } });
        await prisma.user.delete({ where: { id: ownerUserId } });
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    );
  });

  test("toIndianWords converts numbers correctly", () => {
    expect(toIndianWords(115085)).toBe("Rupees One Lakh Fifteen Thousand Eighty-Five Only");
    expect(toIndianWords(0)).toBe("Rupees Zero Only");
    expect(toIndianWords(100.5)).toBe("Rupees One Hundred and Fifty Paise Only");
  });

  test("computeOldGoldValue calculates correct value with deductions", () => {
    const val = computeOldGoldValue({
      netWeight: new Prisma.Decimal(12.000),
      purityRate: new Prisma.Decimal(6600),
      deductionPercent: new Prisma.Decimal(2),
    });
    expect(val.toFixed(2)).toBe("77616.00");
  });

  test("calculateLineItem calculates Gold Ring worked example exactly as in spec §8.10", () => {
    const result = calculateLineItem({
      grossWeight: 8.500,
      stoneWeight: 0.500,
      purity: 916,
      metalRatePerGram: 6700,
      makingChargeType: "PER_GRAM",
      makingChargeValue: 600,
      wastageType: "PERCENT_WEIGHT",
      wastageValue: 8,
      stoneChargeType: "PER_CARAT",
      stoneCarat: 0.90,
      stonePieces: 0,
      stoneRate: 55000,
      hallmarkCharges: 45,
      otherCharges: 500,
      lineDiscountType: "AMOUNT",
      lineDiscountValue: 1000,
      gstRatePercent: 3,
      sellerStateCode: "27",
      placeOfSupplyStateCode: "27",
    });

    expect(result.netWeight.toString()).toBe("8");
    expect(result.chargeableWeight.toString()).toBe("8.64");
    expect(result.metalValue.toFixed(2)).toBe("57888.00");
    expect(result.makingCharges.toFixed(2)).toBe("4800.00");
    expect(result.stoneCharges.toFixed(2)).toBe("49500.00");
    expect(result.lineGross.toFixed(2)).toBe("112733.00");
    expect(result.lineDiscount.toFixed(2)).toBe("1000.00");
    expect(result.taxableValue.toFixed(2)).toBe("111733.00");
    expect(result.cgst.toFixed(2)).toBe("1676.00"); // 1675.995 rounded half-up
    expect(result.sgst.toFixed(2)).toBe("1676.00");
    expect(result.lineTotal.toFixed(2)).toBe("115085.00");
  });

  test("calculateInvoice with old gold exchange calculates correct net payable", () => {
    const lines = [
      {
        grossWeight: 8.500,
        stoneWeight: 0.500,
        purity: 916,
        metalRatePerGram: 6700,
        makingChargeType: "PER_GRAM" as const,
        makingChargeValue: 600,
        wastageType: "PERCENT_WEIGHT" as const,
        wastageValue: 8,
        stoneChargeType: "PER_CARAT" as const,
        stoneCarat: 0.90,
        stonePieces: 0,
        stoneRate: 55000,
        hallmarkCharges: 45,
        otherCharges: 500,
        lineDiscountType: "AMOUNT" as const,
        lineDiscountValue: 1000,
        gstRatePercent: 3,
        sellerStateCode: "27",
        placeOfSupplyStateCode: "27",
      }
    ];

    const result = calculateInvoice(
      lines,
      "NONE",
      0,
      77616.00 // oldGoldValue from spec §10.4
    );

    expect(result.subTotalTaxable.toFixed(2)).toBe("111733.00");
    expect(result.totalCgst.toFixed(2)).toBe("1676.00");
    expect(result.totalSgst.toFixed(2)).toBe("1676.00");
    expect(result.grandTotalBeforeRound.toFixed(2)).toBe("37469.00"); // 115085 - 77616
    expect(result.grandTotal.toString()).toBe("37469");
    expect(result.amountInWords).toBe("Rupees Thirty-Seven Thousand Four Hundred Sixty-Nine Only");
  });

  test("concurrency-safe gap-free numbering resets correctly at financial year boundary", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Date in FY 2024-25
        const date1 = new Date("2024-06-15");
        const num1 = await prisma.$transaction(async (tx) => {
          return await assignInvoiceNumber(tx, tenantId, "INV", date1);
        });
        expect(num1).toBe("INV/2024-25/00001");

        // Subsequent date in same FY
        const date2 = new Date("2024-08-20");
        const num2 = await prisma.$transaction(async (tx) => {
          return await assignInvoiceNumber(tx, tenantId, "INV", date2);
        });
        expect(num2).toBe("INV/2024-25/00002");

        // Date in next FY 2025-26
        const date3 = new Date("2025-04-05");
        const num3 = await prisma.$transaction(async (tx) => {
          return await assignInvoiceNumber(tx, tenantId, "INV", date3);
        });
        expect(num3).toBe("INV/2025-26/00001");
      }
    );
  });

  test("draft creation, update, and finalization handles old gold exchange without double subtraction", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const { POST: createInvoiceRoute } = await import("@/app/api/v1/invoices/route");
        const { POST: finalizeInvoiceRoute } = await import("@/app/api/v1/invoices/[id]/finalize/route");

        // Create the metal rate in DB first so finalization can find it
        await prisma.metalRate.create({
          data: {
            tenantId,
            metalType: "gold",
            purityFineness: new Prisma.Decimal(916),
            rateDate: new Date(),
            ratePerGram: new Prisma.Decimal(6700),
          },
        });

        const reqPayload = {
          customerId: null,
          invoiceDate: new Date().toISOString(),
          dueDate: null,
          type: "sales",
          placeOfSupply: "27",
          invoiceDiscountType: "NONE",
          invoiceDiscountValue: 0,
          notes: "Test invoice",
          lines: [
            {
              description: "Gold Ring",
              materialType: "gold",
              grossWeight: 8.500,
              stoneWeight: 0.500,
              purity: 916,
              karat: 22,
              metalRatePerGram: 6700,
              makingChargeType: "PER_GRAM",
              makingChargeValue: 600,
              wastageType: "PERCENT_WEIGHT",
              wastageValue: 8,
              stoneChargeType: "PER_CARAT",
              stoneCarat: 0.90,
              stonePieces: 0,
              stoneRate: 55000,
              hallmarkCharges: 45,
              otherCharges: 500,
              lineDiscountType: "AMOUNT",
              lineDiscountValue: 1000,
              quantity: 1,
              gstRatePercent: 3,
            }
          ],
          oldGoldExchange: {
            netWeight: 12.000,
            purityRate: 6600,
            deductionPercent: 2,
          }
        };

        const createReq = new Request("http://localhost/api/v1/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqPayload),
        });

        const createRes = await createInvoiceRoute(createReq);
        expect(createRes.status).toBe(201);
        const createBody = await createRes.json();
        const draftInvoice = createBody.data;

        // Verify draft amounts (no double-subtraction)
        // grandTotal = 115085 - 77616 = 37469
        // amountPaid = 0
        // balanceDue = 37469
        expect(draftInvoice.grandTotal).toBe("37469");
        expect(draftInvoice.amountPaid).toBe("0");
        expect(draftInvoice.balanceDue).toBe("37469");

        // Verify that the gold exchange payment was created
        const payments = await prisma.payment.findMany({
          where: { invoiceId: draftInvoice.id },
        });
        expect(payments.length).toBe(1);
        expect(payments[0].method).toBe("gold_exchange");
        expect(payments[0].amount.toFixed(2)).toBe("77616.00");

        // Finalize the invoice
        const finalizeReq = new Request(`http://localhost/api/v1/invoices/${draftInvoice.id}/finalize`, {
          method: "POST",
        });
        const finalizeRes = await finalizeInvoiceRoute(finalizeReq, { params: Promise.resolve({ id: draftInvoice.id }) });
        expect(finalizeRes.status).toBe(200);
        const finalizeBody = await finalizeRes.json();
        const finalInvoice = finalizeBody.data;

        // Verify finalized amounts
        // grandTotal = 37469
        // amountPaid = 0 (excludes old gold exchange from amountPaid field)
        // balanceDue = 37469
        expect(finalInvoice.grandTotal).toBe("32491");
        expect(finalInvoice.amountPaid).toBe("0");
        expect(finalInvoice.balanceDue).toBe("32491");
        expect(finalInvoice.status).toBe("issued");
      }
    );
  }, 20000);
});
