import { describe, test, expect, beforeAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";

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

describe("Business Settings Address & Default Payment Mode Integration Tests", () => {
  let tenantId: string;
  let ownerUserId: string;

  beforeAll(async () => {
    // Seed settings permissions if missing
    await prisma.permission.createMany({
      data: [
        { key: "settings:read", module: "settings", description: "View settings" },
        { key: "settings:write", module: "settings", description: "Edit settings" },
      ],
      skipDuplicates: true,
    });

    // Create a unique tenant and owner
    const rand = Math.floor(Math.random() * 100000);
    const tenant = await prisma.tenant.create({
      data: {
        name: `Jeweller Address Test ${rand}`,
        slug: `jeweller-addr-${rand}`,
      },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        authUserId: `auth-addr-${rand}`,
        email: `addr-${rand}@jeweller.com`,
        fullName: "Store Owner",
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
  });

  test("can update and retrieve address details and default payment mode via API", async () => {
    const { GET, PATCH } = await import("@/app/api/v1/settings/business/route");

    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const addressPayload = {
          street: "Shop 4, Zaveri Bazaar",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400002",
          country: "India",
        };

        const patchReq = new Request("http://localhost/api/v1/settings/business", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: addressPayload,
            defaultPaymentMode: "upi",
          }),
        });

        const patchRes = await PATCH(patchReq);
        expect(patchRes.status).toBe(200);
        const patchBody = await patchRes.json();
        expect(patchBody.data.address).toEqual(addressPayload);
        expect(patchBody.data.defaultPaymentMode).toBe("upi");

        // Verify GET returns the persisted data
        const getRes = await GET();
        expect(getRes.status).toBe(200);
        const getBody = await getRes.json();
        expect(getBody.data.address).toEqual(addressPayload);
        expect(getBody.data.defaultPaymentMode).toBe("upi");
      }
    );
  }, 20000);
});
