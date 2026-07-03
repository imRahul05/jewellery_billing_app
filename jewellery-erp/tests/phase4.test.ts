import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";
import { Prisma } from "@prisma/client";
import { getDashboardStatsQuery } from "@/lib/db/queries/dashboard";
import { getReportsQuery } from "@/lib/db/queries/reports";

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

describe("Phase 4 Dashboard and Reports Integration Tests", () => {
  let tenantId: string;
  let ownerUserId: string;
  let ownerMembershipId: string;

  beforeAll(async () => {
    // 1. Seed global permissions first
    const permissionsToSeed = [
      { key: "dashboard:read", module: "dashboard", description: "View dashboard" },
      { key: "customer:read", module: "customers", description: "View customers" },
      { key: "customer:write", module: "customers", description: "Create/edit customers" },
      { key: "supplier:read", module: "suppliers", description: "View suppliers" },
      { key: "supplier:write", module: "suppliers", description: "Create/edit suppliers" },
      { key: "inventory:read", module: "inventory", description: "View inventory" },
      { key: "inventory:write", module: "inventory", description: "Create/edit inventory" },
      { key: "invoice:read", module: "billing", description: "View invoices" },
      { key: "invoice:create", module: "billing", description: "Create invoices" },
      { key: "payment:record", module: "billing", description: "Record payments" },
      { key: "metal_rate:read", module: "pricing", description: "View metal rates" },
      { key: "metal_rate:write", module: "pricing", description: "Set metal rates" },
      { key: "report:read", module: "reports", description: "View reports" },
      { key: "report:export", module: "reports", description: "Export reports" },
      { key: "settings:read", module: "settings", description: "View settings" },
      { key: "settings:write", module: "settings", description: "Edit settings" },
    ];

    await prisma.permission.createMany({
      data: permissionsToSeed,
      skipDuplicates: true,
    });

    // 2. Create a clean test Tenant
    const tenant = await prisma.tenant.create({
      data: { name: "Test Phase 4 Store", slug: `test-p4-${Date.now()}` },
    });
    tenantId = tenant.id;

    // 3. Create Owner User
    const ownerUser = await prisma.user.create({
      data: { authUserId: `owner-p4-${Date.now()}`, email: `owner-p4-${Date.now()}@test.com`, fullName: "Store Owner" },
    });
    ownerUserId = ownerUser.id;

    // 4. Create Membership
    const ownerMembership = await prisma.userTenantMembership.create({
      data: { tenantId, userId: ownerUserId, isActive: true },
    });
    ownerMembershipId = ownerMembership.id;

    // 5. Seed system roles for the tenant
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
        await prisma.inventoryItem.deleteMany({ where: { tenantId } });
        await prisma.product.deleteMany({ where: { tenantId } });
        await prisma.userRole.deleteMany({ where: { membershipId: ownerMembershipId } });
        await prisma.userTenantMembership.delete({ where: { id: ownerMembershipId } });
        await prisma.user.delete({ where: { id: ownerUserId } });
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    );
  });

  test("getDashboardStatsQuery computes stats correctly with active invoices and low stock", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Create a product categories / products
        const product = await prisma.product.create({
          data: {
            tenantId,
            sku: `GOLD-RING-P4-${Date.now()}`,
            name: "Gold Diamond Ring",
            metalType: "gold",
            isActive: true,
          },
        });

        // Insert some in-stock inventory items for this product
        await prisma.inventoryItem.create({
          data: {
            tenantId,
            productId: product.id,
            tagNumber: `TAG-P4-1-${Date.now()}`,
            grossWeight: new Prisma.Decimal(8.500),
            netWeight: new Prisma.Decimal(8.000),
            purityFineness: new Prisma.Decimal(0.916),
            costPrice: new Prisma.Decimal(45000),
            status: "in_stock",
          },
        });

        // Insert a metal rate
        await prisma.metalRate.create({
          data: {
            tenantId,
            metalType: "gold",
            rateDate: new Date(),
            ratePerGram: new Prisma.Decimal(6800),
          },
        });

        // Issue a sales invoice (Today)
        const invoice = await prisma.invoice.create({
          data: {
            tenantId,
            invoiceNumber: `INV-P4-001-${Date.now()}`,
            type: "sales",
            status: "issued",
            invoiceDate: new Date(),
            subtotal: new Prisma.Decimal(45000),
            grandTotal: new Prisma.Decimal(46350),
            balanceDue: new Prisma.Decimal(46350),
          },
        });

        // Query dashboard data
        const data = await getDashboardStatsQuery(tenantId);

        // Verify KPIs
        expect(data.kpis.todaysSales).toBe("46350");
        expect(data.kpis.monthSales).toBe("46350");
        expect(data.kpis.outstanding).toBe("46350");
        // Low Stock Count: 1 product is active, which has 1 item in stock (< 3 threshold).
        expect(data.kpis.lowStockCount).toBe(1);

        // Verify recent invoices list
        expect(data.recentInvoices.length).toBeGreaterThan(0);
        expect(data.recentInvoices[0].invoiceNumber).toBe(invoice.invoiceNumber);

        // Verify metal rates loaded
        expect(data.metalRates.length).toBeGreaterThan(0);
        const goldRate = data.metalRates.find((r) => r.metalType === "gold");
        expect(Number(goldRate?.ratePerGram)).toBe(6800);

        // Verify sales trend exists
        expect(data.salesTrend.length).toBe(7);
        expect(data.salesTrend[6].total).toBe("46350");
      }
    );
  });

  test("getReportsQuery aggregates calculations properly", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const reports = await getReportsQuery(tenantId, {
          startDate: start,
          endDate: end,
        });

        expect(reports.summary.salesCount).toBe(1);
        expect(reports.summary.salesTotal).toBe("46350");
        expect(reports.inventory.inStockCount).toBe(1);
        expect(reports.inventory.inStockCostPrice).toBe("45000");
      }
    );
  });
});
