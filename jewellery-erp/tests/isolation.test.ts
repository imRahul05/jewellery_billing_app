import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { Prisma } from "@prisma/client";

describe("Multi-Tenant Data Isolation Tests", () => {
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // 1. Create clean test Tenants
    const tenantA = await prisma.tenant.create({
      data: { name: "Test Business A", slug: `test-a-${Date.now()}` },
    });
    tenantAId = tenantA.id;

    const tenantB = await prisma.tenant.create({
      data: { name: "Test Business B", slug: `test-b-${Date.now()}` },
    });
    tenantBId = tenantB.id;

    // 2. Create corresponding Users
    const userA = await prisma.user.create({
      data: { authUserId: `auth-a-${Date.now()}`, email: `user-a-${Date.now()}@test.com` },
    });
    userAId = userA.id;

    const userB = await prisma.user.create({
      data: { authUserId: `auth-b-${Date.now()}`, email: `user-b-${Date.now()}@test.com` },
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
    // Clean up created test data using raw client paths (GLOBAL_MODELS bypass)
    // Delete tenant-scoped invoices under super admin bypass
    await runWithTenant(
      { tenantId: "", userId: "", isSuperAdmin: true },
      async () =>
        await prisma.invoice.deleteMany({
          where: { tenantId: { in: [tenantAId, tenantBId] } },
        })
    );

    await prisma.userTenantMembership.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId] } },
    });
  });

  test("Tenant A context cannot read Tenant B data", async () => {
    // Create an invoice in Tenant B
    const invoiceB = await runWithTenant(
      { tenantId: tenantBId, userId: userBId, isSuperAdmin: false },
      async () =>
        await prisma.invoice.create({
          data: {
            tenantId: tenantBId,
            invoiceNumber: "INV-B-001",
            type: "sales",
            status: "draft",
            grandTotal: 1000,
          },
        })
    );

    // Try reading it from Tenant A context
    const readAttempt = await runWithTenant(
      { tenantId: tenantAId, userId: userAId, isSuperAdmin: false },
      async () => {
        return await prisma.invoice.findFirst({
          where: { id: invoiceB.id },
        });
      }
    );

    expect(readAttempt).toBeNull();
  });

  test("Tenant A context cannot write or spoof Tenant B tenantId", async () => {
    // Trying to create a record for Tenant B from Tenant A context must stamp it with Tenant A
    const createdInvoice = await runWithTenant(
      { tenantId: tenantAId, userId: userAId, isSuperAdmin: false },
      async () =>
        await prisma.invoice.create({
          data: {
            tenantId: tenantAId,
            invoiceNumber: "INV-A-002",
            type: "sales",
            status: "draft",
            grandTotal: 500,
          },
        })
    );

    expect(createdInvoice.tenantId).toBe(tenantAId);

    // Explicit spoof attempt (client supply tenantId = B in args while context is A)
    await expect(
      runWithTenant(
        { tenantId: tenantAId, userId: userAId, isSuperAdmin: false },
        async () =>
          await prisma.invoice.create({
            data: {
              invoiceNumber: "INV-A-SPOOF",
              type: "sales",
              status: "draft",
              grandTotal: 500,
              tenantId: tenantBId, // spoof attempt
            } as Prisma.InvoiceUncheckedCreateInput,
          })
      )
    ).rejects.toThrow("Cross-tenant create rejected");
  });

  test("Accessing tenant-scoped model without active context bound throws", async () => {
    // Queries outside runWithTenant or withTenant wrapper must fail
    await expect(
      prisma.invoice.findMany()
    ).rejects.toThrow("Tenant-scoped model \"Invoice\" queried without tenant context");
  });
});
