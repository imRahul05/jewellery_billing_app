import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
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

describe("Phase 2 Master Data & Operations Integration Tests", () => {
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
      data: { name: "Test Phase 2 Store", slug: `test-p2-${Date.now()}` },
    });
    tenantId = tenant.id;

    // 2. Create Owner User
    const ownerUser = await prisma.user.create({
      data: { authUserId: `owner-p2-${Date.now()}`, email: `owner-p2-${Date.now()}@test.com`, fullName: "Store Owner" },
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
    // Clean up created test data in raw transaction context
    await runWithTenant(
      { tenantId: "", userId: "", isSuperAdmin: true },
      async () => {
        // Delete items, movements, products, categories
        await prisma.stockMovement.deleteMany({ where: { tenantId } });
        await prisma.stockAdjustment.deleteMany({ where: { tenantId } });
        await prisma.stockTransfer.deleteMany({ where: { tenantId } });
        await prisma.inventoryItem.deleteMany({ where: { product: { tenantId } } });
        await prisma.product.deleteMany({ where: { tenantId } });
        await prisma.productCategory.deleteMany({ where: { tenantId } });
        await prisma.metalRate.deleteMany({ where: { tenantId } });

        // Delete billing
        await prisma.payment.deleteMany({ where: { customer: { tenantId } } });
        await prisma.invoice.deleteMany({ where: { tenantId } });
        await prisma.customer.deleteMany({ where: { tenantId } });
        await prisma.supplier.deleteMany({ where: { tenantId } });

        // Delete business settings
        await prisma.businessSetting.deleteMany({ where: { tenantId } });

        // Delete memberships & roles
        await prisma.userRole.deleteMany({ where: { membershipId: ownerMembershipId } });
        await prisma.userTenantMembership.deleteMany({ where: { tenantId } });
        await prisma.rolePermission.deleteMany({ where: { role: { tenantId } } });
        await prisma.role.deleteMany({ where: { tenantId } });
        await prisma.user.deleteMany({ where: { id: ownerUserId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      }
    );
  });

  test("Business Config & Settings validation", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Create settings
        const settings = await prisma.businessSetting.create({
          data: {
            tenantId,
            defaultGstRate: new Prisma.Decimal(3.0),
            gstRegistered: true,
            makingChargeMode: "per_gram",
            defaultMakingCharge: new Prisma.Decimal(450.0),
            invoicePrefix: "INV-TEST",
            invoiceNextSeq: 1001n,
          },
        });

        expect(settings.invoicePrefix).toBe("INV-TEST");
        expect(settings.defaultGstRate.toString()).toBe("3");
        expect(settings.invoiceNextSeq).toBe(1001n);

        // Update settings
        const updated = await prisma.businessSetting.update({
          where: { tenantId },
          data: {
            invoicePrefix: "INV-UPDATED",
            invoiceNextSeq: 1005n,
          },
        });

        expect(updated.invoicePrefix).toBe("INV-UPDATED");
        expect(updated.invoiceNextSeq).toBe(1005n);
      }
    );
  });

  test("Daily Metal Rates scoping and creation", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Create a Gold Rate
        const rate = await prisma.metalRate.create({
          data: {
            tenantId,
            metalType: MetalType.gold,
            purityFineness: new Prisma.Decimal(0.916),
            ratePerGram: new Prisma.Decimal(7250.0),
            rateDate: new Date(),
          },
        });

        expect(rate.metalType).toBe(MetalType.gold);
        expect(rate.purityFineness.toString()).toBe("0.916");
        expect(rate.ratePerGram.toString()).toBe("7250");
      }
    );
  });

  test("Customer ledger running balance calculations", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Create Customer with opening balance
        const customer = await prisma.customer.create({
          data: {
            tenantId,
            name: "John Doe",
            phone: `9900${Date.now().toString().slice(-6)}`,
            openingBalance: new Prisma.Decimal(10000.0),
          },
        });

        // 1. Add Sales Invoice (adds 5000)
        const invoice = await prisma.invoice.create({
          data: {
            tenantId,
            customerId: customer.id,
            invoiceNumber: `INV-${Date.now()}`,
            type: "sales",
            status: "draft",
            grandTotal: new Prisma.Decimal(5000.0),
            invoiceDate: new Date(),
          },
        });

        // 2. Add Payment (reduces 3000)
        const payment = await prisma.payment.create({
          data: {
            customerId: customer.id,
            referenceNo: "PAY-1",
            amount: new Prisma.Decimal(3000.0),
            method: "cash",
            status: "completed",
            paidAt: new Date(),
          },
        });

        // Compute running balance chronologically
        let balance = new Prisma.Decimal(customer.openingBalance);
        
        // Add invoice grandTotal
        balance = balance.add(invoice.grandTotal);
        expect(balance.toString()).toBe("15000");

        // Subtract payment amount
        balance = balance.sub(payment.amount);
        expect(balance.toString()).toBe("12000");
      }
    );
  });

  test("Physical Inventory Stock adjustments & transfers", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        // Setup category & product
        const category = await prisma.productCategory.create({
          data: { tenantId, name: "Gold Chains" },
        });

        const product = await prisma.product.create({
          data: {
            tenantId,
            sku: `SKU-${Date.now()}`,
            name: "Double Rope Chain",
            categoryId: category.id,
            metalType: MetalType.gold,
            defaultPurity: new Prisma.Decimal(0.916),
            defaultKarat: 22,
          },
        });

        // Create Item piece
        const item = await prisma.inventoryItem.create({
          data: {
            productId: product.id,
            tagNumber: `TAG-${Date.now()}`,
            grossWeight: new Prisma.Decimal(10.5),
            netWeight: new Prisma.Decimal(10.0),
            stoneWeight: new Prisma.Decimal(0.5),
            purityFineness: new Prisma.Decimal(0.916),
            karat: 22,
            quantity: 1,
            location: "Showcase A",
            status: "in_stock",
            costPrice: new Prisma.Decimal(65000),
          },
        });

        expect(item.grossWeight.toString()).toBe("10.5");
        expect(item.location).toBe("Showcase A");

        // Perform stock transfer to Showcase B
        const transfer = await prisma.stockTransfer.create({
          data: {
            tenantId,
            fromLocation: item.location || "Showcase A",
            toLocation: "Showcase B",
            status: "in_transit",
            dispatchedBy: ownerUserId,
            dispatchedAt: new Date(),
          },
        });

        // Update item status
        const itemTransit = await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { status: "in_transit" },
        });
        expect(itemTransit.status).toBe("in_transit");

        // Complete the transfer
        await prisma.stockTransfer.update({
          where: { id: transfer.id },
          data: { status: "completed", receivedBy: ownerUserId, receivedAt: new Date() },
        });

        const itemReceived = await prisma.inventoryItem.update({
          where: { id: item.id },
          data: { location: "Showcase B", status: "in_stock" },
        });

        expect(itemReceived.location).toBe("Showcase B");
        expect(itemReceived.status).toBe("in_stock");
      }
    );
  });
});
