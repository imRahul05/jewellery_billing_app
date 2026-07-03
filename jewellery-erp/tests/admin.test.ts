import { describe, test, expect, beforeAll, afterAll, vi, type Mock } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { GET as getBusinessesRoute, POST as createBusinessRoute } from "@/app/api/v1/admin/businesses/route";
import { GET as getBusinessDetailsRoute, PATCH as updateBusinessStatusRoute } from "@/app/api/v1/admin/businesses/[id]/route";
import { requireSession } from "@/lib/auth/session";
import { revalidateTag } from "next/cache";

// Mock next/cache so that it does not crash when called inside route handlers
vi.mock("next/cache", () => {
  return {
    cacheLife: vi.fn(),
    cacheTag: vi.fn(),
    revalidateTag: vi.fn(),
  };
});

// Mock requireSession to fetch context from Active Tenant Context
vi.mock("@/lib/auth/session", () => {
  return {
    requireSession: vi.fn(),
  };
});

describe("Admin Portal Integration Tests", () => {
  let superAdminUserId: string;
  let regularUserId: string;
  let testTenantId: string;
  let testMembershipId: string;

  beforeAll(async () => {
    // 1. Create a super admin user in Postgres projection
    const superAdminUser = await prisma.user.create({
      data: {
        authUserId: `super-admin-auth-${Date.now()}`,
        email: `super-admin-${Date.now()}@test.com`,
        fullName: "System Super Admin",
        isSuperAdmin: true,
      },
    });
    superAdminUserId = superAdminUser.id;

    // 2. Create a standard regular user in Postgres projection
    const regularUser = await prisma.user.create({
      data: {
        authUserId: `standard-user-auth-${Date.now()}`,
        email: `standard-user-${Date.now()}@test.com`,
        fullName: "Standard Business User",
        isSuperAdmin: false,
      },
    });
    regularUserId = regularUser.id;

    // 3. Create a tenant for baseline listings
    const tenant = await prisma.tenant.create({
      data: {
        name: "Legacy Gold Store",
        slug: `legacy-slug-${Date.now()}`,
      },
    });
    testTenantId = tenant.id;

    // 4. Create membership
    const membership = await prisma.userTenantMembership.create({
      data: {
        tenantId: testTenantId,
        userId: regularUserId,
        isActive: true,
      },
    });
    testMembershipId = membership.id;
  });

  afterAll(async () => {
    // Cleanup created records globally as super admin
    await runWithTenant(
      { tenantId: "", userId: "", isSuperAdmin: true },
      async () => {
        // Delete billing
        await prisma.payment.deleteMany({ where: { invoice: { tenantId: testTenantId } } });
        await prisma.invoiceLineItem.deleteMany({ where: { invoice: { tenantId: testTenantId } } });
        await prisma.invoice.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.customer.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.supplier.deleteMany({ where: { tenantId: testTenantId } });

        // Delete inventory
        await prisma.stockMovement.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.stockAdjustment.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.stockTransfer.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.inventoryItem.deleteMany({ where: { product: { tenantId: testTenantId } } });
        await prisma.product.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.productCategory.deleteMany({ where: { tenantId: testTenantId } });

        // Delete settings & metal rates
        await prisma.metalRate.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.businessSetting.deleteMany({ where: { tenantId: testTenantId } });

        // Delete memberships, roles, and audit logs
        await prisma.userRole.deleteMany({
          where: {
            membership: { tenantId: testTenantId },
          },
        });
        await prisma.userTenantMembership.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.rolePermission.deleteMany({ where: { role: { tenantId: testTenantId } } });
        await prisma.role.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.auditLog.deleteMany({ where: { tenantId: testTenantId } });

        // Delete the test tenant itself
        await prisma.tenant.deleteMany({ where: { id: testTenantId } });

        // Clean up users
        await prisma.user.deleteMany({ where: { id: { in: [superAdminUserId, regularUserId] } } });
      }
    );
  });

  test("1. Access Control - Non-SuperAdmin requests are rejected", async () => {
    (requireSession as Mock).mockResolvedValueOnce({
      userId: regularUserId,
      tenantId: testTenantId,
      membershipId: testMembershipId,
      isSuperAdmin: false,
    });

    const response = await getBusinessesRoute();
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  }, 30000);

  test("2. Business Listings - Super Admin can list registered businesses", async () => {
    (requireSession as Mock).mockResolvedValueOnce({
      userId: superAdminUserId,
      tenantId: testTenantId,
      membershipId: testMembershipId,
      isSuperAdmin: true,
    });

    const response = await getBusinessesRoute();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    const match = body.data.find((t: { id: string }) => t.id === testTenantId);
    expect(match).toBeDefined();
    expect(match.name).toBe("Legacy Gold Store");
  }, 30000);

  test("3. Onboarding Transaction - Super Admin registers a brand new business", async () => {
    (requireSession as Mock).mockResolvedValueOnce({
      userId: superAdminUserId,
      tenantId: testTenantId,
      membershipId: testMembershipId,
      isSuperAdmin: true,
    });

    // Mock fetch for server-to-server Neon Auth signup endpoint
    const mockFetch = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            user: {
              id: `mock-auth-uid-${Date.now()}`,
              email: "owner-new@test.com",
              name: "New Owner",
            },
          }),
      });
    });
    vi.stubGlobal("fetch", mockFetch);

    const payload = {
      businessName: "Test Elite Gems",
      ownerName: "Abhishek Gupta",
      ownerEmail: `owner-${Date.now()}@test.com`,
      ownerPassword: "password123",
    };

    const req = new Request("http://localhost:3000/api/v1/admin/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const response = await createBusinessRoute(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.name).toBe("Test Elite Gems");
    expect(body.data.isActive).toBe(true);

    // Verify DB states for the newly onboarded business in global context
    await runWithTenant(
      { tenantId: "", userId: "", isSuperAdmin: true },
      async () => {
        const createdTenant = await prisma.tenant.findUniqueOrThrow({
          where: { id: body.data.id },
          include: {
            memberships: {
              include: {
                user: true,
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
            settings: true,
          },
        });

        expect(createdTenant.isActive).toBe(true);
        expect(createdTenant.settings?.baseCurrency).toBe("INR");
        expect(createdTenant.memberships.length).toBe(1);

        const ownerMember = createdTenant.memberships[0];
        expect(ownerMember.user.email).toBe(payload.ownerEmail);
        expect(ownerMember.userRoles.length).toBe(1);
        expect(ownerMember.userRoles[0].role.name).toBe("Business Owner");

        // Cleanup the created new store records
        await prisma.userRole.deleteMany({ where: { membershipId: ownerMember.id } });
        await prisma.userTenantMembership.deleteMany({ where: { id: ownerMember.id } });
        await prisma.businessSetting.deleteMany({ where: { tenantId: createdTenant.id } });
        await prisma.rolePermission.deleteMany({ where: { role: { tenantId: createdTenant.id } } });
        await prisma.role.deleteMany({ where: { tenantId: createdTenant.id } });
        await prisma.user.deleteMany({ where: { id: ownerMember.user.id } });
        await prisma.tenant.deleteMany({ where: { id: createdTenant.id } });
      }
    );

    vi.unstubAllGlobals();
  }, 30000);

  test("4. Status Updates & Cache Invalidation - Super Admin toggles business deactivation", async () => {
    // 1. Get business details query
    (requireSession as Mock).mockResolvedValueOnce({
      userId: superAdminUserId,
      tenantId: testTenantId,
      membershipId: testMembershipId,
      isSuperAdmin: true,
    });

    const paramsObj = Promise.resolve({ id: testTenantId });
    const getRes = await getBusinessDetailsRoute(
      new Request(`http://localhost:3000/api/v1/admin/businesses/${testTenantId}`),
      { params: paramsObj }
    );
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.tenant.id).toBe(testTenantId);
    expect(getBody.data.tenant.isActive).toBe(true);

    // 2. Toggle isActive to false (Deactivate)
    (requireSession as Mock).mockResolvedValueOnce({
      userId: superAdminUserId,
      tenantId: testTenantId,
      membershipId: testMembershipId,
      isSuperAdmin: true,
    });

    const patchReq = new Request(`http://localhost:3000/api/v1/admin/businesses/${testTenantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    const patchRes = await updateBusinessStatusRoute(patchReq, { params: paramsObj });
    expect(patchRes.status).toBe(200);

    const patchBody = await patchRes.json();
    expect(patchBody.data.isActive).toBe(false);

    // Check database state
    const dbTenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: testTenantId },
    });
    expect(dbTenant.isActive).toBe(false);

    // Verify cache tag invalidation was triggered
    expect(revalidateTag).toHaveBeenCalledWith(`tenant-${testTenantId}`);
  }, 30000);


});
