import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";
import { getEffectivePermissions, hasPermission } from "@/lib/rbac/permissions";
import { authorize, AuthorizationError } from "@/lib/rbac/authorize";
import { assignRole, revokeRole, deactivateMember } from "@/app/(app)/settings/users/actions";
import { runWithTenant } from "@/lib/db/tenant-context";

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

describe("RBAC and Authorization Security Tests", () => {
  let tenantId: string;
  let ownerUserId: string;
  let cashierUserId: string;
  let ownerMembershipId: string;
  let cashierMembershipId: string;

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
      { key: "report:export", module: "reports", description: "Export reports" },
      { key: "settings:read", module: "settings", description: "View settings" },
      { key: "settings:write", module: "settings", description: "Edit settings" },
      { key: "user:manage", module: "settings", description: "Manage users" },
      { key: "role:manage", module: "settings", description: "Manage roles" },
      { key: "audit:read", module: "audit", description: "View audit logs" },
    ];

    await prisma.permission.createMany({
      data: permissionsToSeed,
      skipDuplicates: true,
    });

    // 1. Create a clean test Tenant
    const tenant = await prisma.tenant.create({
      data: { name: "Test RBAC Store", slug: `test-rbac-${Date.now()}` },
    });
    tenantId = tenant.id;

    // 2. Create Users
    const ownerUser = await prisma.user.create({
      data: { authUserId: `owner-${Date.now()}`, email: `owner-${Date.now()}@rbac.com`, fullName: "Store Owner" },
    });
    ownerUserId = ownerUser.id;

    const cashierUser = await prisma.user.create({
      data: { authUserId: `cashier-${Date.now()}`, email: `cashier-${Date.now()}@rbac.com`, fullName: "POS Cashier" },
    });
    cashierUserId = cashierUser.id;

    // 3. Create Memberships
    const ownerMembership = await prisma.userTenantMembership.create({
      data: { tenantId, userId: ownerUserId, isActive: true },
    });
    ownerMembershipId = ownerMembership.id;

    const cashierMembership = await prisma.userTenantMembership.create({
      data: { tenantId, userId: cashierUserId, isActive: true },
    });
    cashierMembershipId = cashierMembership.id;

    // 4. Seed system roles for the tenant
    await seedTenantRoles(tenantId);

    // Fetch the owner and cashier roles
    const ownerRole = await prisma.role.findFirstOrThrow({
      where: { tenantId, name: "Business Owner" },
    });
    const cashierRole = await prisma.role.findFirstOrThrow({
      where: { tenantId, name: "Cashier" },
    });

    // 5. Assign roles
    await prisma.userRole.createMany({
      data: [
        { membershipId: ownerMembershipId, roleId: ownerRole.id },
        { membershipId: cashierMembershipId, roleId: cashierRole.id },
      ],
    });
  });

  afterAll(async () => {
    // Clean up created test data using raw client paths (GLOBAL_MODELS bypass)
    await prisma.userRole.deleteMany({
      where: { membershipId: { in: [ownerMembershipId, cashierMembershipId] } },
    });
    await prisma.userTenantMembership.deleteMany({
      where: { tenantId },
    });
    await prisma.rolePermission.deleteMany({
      where: { role: { tenantId } },
    });
    await prisma.role.deleteMany({
      where: { tenantId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUserId, cashierUserId] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: tenantId },
    });
  });

  test("System roles have correct permissions seeded", async () => {
    // Owner role should have user:manage permission
    const ownerPerms = await getEffectivePermissions(ownerUserId, tenantId);
    expect(ownerPerms.has("user:manage")).toBe(true);
    expect(ownerPerms.has("invoice:create")).toBe(true);

    // Cashier role should have invoice:create but NOT user:manage
    const cashierPerms = await getEffectivePermissions(cashierUserId, tenantId);
    expect(cashierPerms.has("invoice:create")).toBe(true);
    expect(cashierPerms.has("user:manage")).toBe(false);
  });

  test("hasPermission returns correct results", async () => {
    const isOwnerAllowed = await hasPermission(
      { userId: ownerUserId, tenantId },
      "role:manage"
    );
    expect(isOwnerAllowed).toBe(true);

    const isCashierAllowed = await hasPermission(
      { userId: cashierUserId, tenantId },
      "role:manage"
    );
    expect(isCashierAllowed).toBe(false);
  });

  test("Last Owner Protection throws error", async () => {
    const ownerRole = await prisma.role.findFirstOrThrow({
      where: { tenantId, name: "Business Owner" },
    });

    // Try revoking Owner role from the last owner
    await expect(
      runWithTenant(
        { tenantId, userId: ownerUserId, isSuperAdmin: false },
        async () =>
          await revokeRole({
            membershipId: ownerMembershipId,
            roleId: ownerRole.id,
          })
      )
    ).resolves.toEqual({
      error: "Last Owner Protection: You cannot deactivate or revoke the Owner role from the last active Business Owner.",
    });

    // Try deactivating the last owner member
    await expect(
      runWithTenant(
        { tenantId, userId: ownerUserId, isSuperAdmin: false },
        async () =>
          await deactivateMember({
            membershipId: ownerMembershipId,
          })
      )
    ).resolves.toEqual({
      error: "Last Owner Protection: You cannot deactivate or revoke the Owner role from the last active Business Owner.",
    });
  });
});
