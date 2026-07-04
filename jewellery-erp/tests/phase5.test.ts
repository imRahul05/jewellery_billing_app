import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db";
import { runWithTenant } from "@/lib/db/tenant-context";
import { checkAndTriggerLowStock } from "@/lib/notifications/dispatcher";
import { writeAuditLog } from "@/lib/audit/logger";

vi.mock("next/cache", () => {
  return {
    cacheLife: () => {},
    cacheTag: () => {},
    revalidateTag: () => {},
  };
});

describe("Phase 5 Audit Logs, Notifications and Impersonation Tests", () => {
  let tenantId: string;
  let ownerUserId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: "Test Phase 5 Store", slug: `test-p5-${Date.now()}` },
    });
    tenantId = tenant.id;

    const ownerUser = await prisma.user.create({
      data: { authUserId: `owner-p5-${Date.now()}`, email: `owner-p5-${Date.now()}@test.com`, fullName: "Store Owner" },
    });
    ownerUserId = ownerUser.id;

    await prisma.userTenantMembership.create({
      data: { tenantId, userId: ownerUserId, isActive: true },
    });
  });

  afterAll(async () => {
    await runWithTenant({ tenantId, userId: ownerUserId, isSuperAdmin: false }, async () => {
      await prisma.notification.deleteMany({ where: { tenantId } });
    });
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.userTenantMembership.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.user.delete({ where: { id: ownerUserId } });
  });

  test("should write audit log entries", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        await writeAuditLog({
          tenantId,
          actorUserId: ownerUserId,
          action: "create",
          entityType: "Product",
          entityId: "test-product-123",
          after: { name: "Gold Chain", weight: 10 },
        });

        const fetchedLogs = await prisma.auditLog.findMany({
          where: { tenantId, entityId: "test-product-123" },
        });

        expect(fetchedLogs.length).toBe(1);
        const log = fetchedLogs[0];
        expect(log.action).toBe("create");
        expect(log.entityType).toBe("Product");
        expect(log.tenantId).toBe(tenantId);
        expect(log.actorUserId).toBe(ownerUserId);
      }
    );
  });

  test("should trigger low stock notifications", async () => {
    await runWithTenant(
      { tenantId, userId: ownerUserId, isSuperAdmin: false },
      async () => {
        const product = await prisma.product.create({
          data: {
            tenantId,
            name: "Test Low Stock Ring",
            sku: `ring-p5-${Date.now()}`,
          },
        });

        await checkAndTriggerLowStock(tenantId, product.id);

        const notifications = await prisma.notification.findMany({
          where: {
            tenantId,
            category: "low_stock",
          },
        });

        expect(notifications.length).toBeGreaterThan(0);
        const lowStockNotif = notifications.find((n) => n.body?.includes(product.name));
        expect(lowStockNotif).toBeDefined();
        expect(lowStockNotif?.status).toBe("pending");
      }
    );
  });
});
