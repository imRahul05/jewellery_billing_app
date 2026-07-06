import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";

describe("Tenant Data Isolation Security Fuzzing", () => {
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // 1. Create clean test Tenants
    const tenantA = await prisma.tenant.create({
      data: { name: "Fuzz Tenant A", slug: `fuzz-a-${Date.now()}` },
    });
    tenantAId = tenantA.id;

    const tenantB = await prisma.tenant.create({
      data: { name: "Fuzz Tenant B", slug: `fuzz-b-${Date.now()}` },
    });
    tenantBId = tenantB.id;

    // 2. Create corresponding Users
    const userA = await prisma.user.create({
      data: { authUserId: `fuzz-auth-a-${Date.now()}`, email: `fuzz-user-a-${Date.now()}@test.com` },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: { authUserId: `fuzz-auth-b-${Date.now()}`, email: `fuzz-user-b-${Date.now()}@test.com` },
    });
    userBId = userB.id;

    // 3. Create active UserTenantMemberships
    await prisma.userTenantMembership.create({
      data: { tenantId: tenantAId, userId: userAId, isActive: true },
    });
    await prisma.userTenantMembership.create({
      data: { tenantId: tenantBId, userId: userBId, isActive: true },
    });
  });

  afterAll(async () => {
    // Cleanup
    await runWithTenant({ tenantId: "", userId: "", isSuperAdmin: true }, async () => {
      await prisma.customer.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
      await prisma.supplier.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
      await prisma.notification.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
      await prisma.auditLog.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    });

    await prisma.userTenantMembership.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
  });

  test("Fuzz cross-tenant reads: Tenant A cannot read Tenant B customers, suppliers, and notifications", async () => {
    // Create Tenant B records
    const { customerB, supplierB, notifB } = await runWithTenant(
      { tenantId: tenantBId, userId: userBId, isSuperAdmin: false },
      async () => {
        const c = await prisma.customer.create({ data: { name: "B Customer", phone: "9876543210" } });
        const s = await prisma.supplier.create({ data: { name: "B Supplier" } });
        const n = await prisma.notification.create({ data: { category: "alert", title: "B Alert" } });
        return { customerB: c, supplierB: s, notifB: n };
      }
    );

    // Try reading these records from Tenant A context
    await runWithTenant(
      { tenantId: tenantAId, userId: userAId, isSuperAdmin: false },
      async () => {
        // Reads should return null or empty array
        const readCust = await prisma.customer.findUnique({ where: { id: customerB.id } });
        expect(readCust).toBeNull();

        const readSupp = await prisma.supplier.findUnique({ where: { id: supplierB.id } });
        expect(readSupp).toBeNull();

        const readNotif = await prisma.notification.findUnique({ where: { id: notifB.id } });
        expect(readNotif).toBeNull();
      }
    );
  });

  test("Fuzz cross-tenant writes: Tenant A cannot update or delete Tenant B records", async () => {
    // Create Tenant B records
    const { customerB } = await runWithTenant(
      { tenantId: tenantBId, userId: userBId, isSuperAdmin: false },
      async () => {
        const c = await prisma.customer.create({ data: { name: "B Customer 2", phone: "9876543211" } });
        return { customerB: c };
      }
    );

    // Try to update Rajesh's name from Tenant A's context
    await runWithTenant(
      { tenantId: tenantAId, userId: userAId, isSuperAdmin: false },
      async () => {
        // Update statement should fail to affect anything because of row-level tenant interceptor
        const updateResult = await prisma.customer.updateMany({
          where: { id: customerB.id },
          data: { name: "Spoofed Name" },
        });
        expect(updateResult.count).toBe(0);

        // Delete statement should fail to affect anything
        const deleteResult = await prisma.customer.deleteMany({
          where: { id: customerB.id },
        });
        expect(deleteResult.count).toBe(0);
      }
    );

    // Verify it is untouched in Tenant B context
    const checkCust = await runWithTenant(
      { tenantId: tenantBId, userId: userBId, isSuperAdmin: false },
      async () => await prisma.customer.findUnique({ where: { id: customerB.id } })
    );
    expect(checkCust?.name).toBe("B Customer 2");
  });
});
