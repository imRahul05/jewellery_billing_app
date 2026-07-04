import { prisma } from "@/lib/db";
import { peekTenantContext, runWithTenant } from "@/lib/db/tenant-context";
import { NotificationChannel, NotificationStatus } from "@prisma/client";

export interface DispatchNotificationInput {
  tenantId: string;
  userId?: string | null;
  category: string;
  title: string;
  body?: string | null;
  payload?: Record<string, unknown> | null;
}

/**
 * Dispatches an in-app notification by creating a database record.
 * Ensures the database query runs under the correct tenant context.
 */
export async function dispatchNotification(input: DispatchNotificationInput): Promise<void> {
  const ctx = peekTenantContext();

  const execute = async () => {
    await prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId ?? null,
        channel: NotificationChannel.in_app,
        status: NotificationStatus.pending,
        category: input.category,
        title: input.title,
        body: input.body ?? null,
        payload: input.payload ? JSON.parse(JSON.stringify(input.payload)) : null,
      },
    });
  };

  if (ctx && ctx.tenantId === input.tenantId) {
    await execute();
  } else {
    await runWithTenant(
      {
        tenantId: input.tenantId,
        userId: input.userId ?? "system",
        isSuperAdmin: false,
      },
      execute
    );
  }
}

/**
 * Checks if a product's active in-stock item count is below 3.
 * If so, dispatches a low stock notification.
 * Avoids duplicate notifications if an active low-stock notification for this product already exists.
 */
export async function checkAndTriggerLowStock(tenantId: string, productId: string): Promise<void> {
  const execute = async () => {
    // 1. Get product details
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      select: { name: true, sku: true },
    });

    if (!product) return;

    // 2. Count active in-stock items
    const count = await prisma.inventoryItem.count({
      where: {
        productId,
        tenantId,
        status: "in_stock",
        deletedAt: null,
      },
    });

    if (count < 3) {
      // 3. Check for existing unread low-stock notification for this product
      const recentNotifications = await prisma.notification.findMany({
        where: {
          tenantId,
          category: "low_stock",
          status: "pending",
        },
      });

      const alreadyNotified = recentNotifications.some((n) => {
        const p = n.payload as Record<string, unknown> | null;
        return p && p.productId === productId;
      });

      if (!alreadyNotified) {
        await prisma.notification.create({
          data: {
            tenantId,
            channel: NotificationChannel.in_app,
            status: NotificationStatus.pending,
            category: "low_stock",
            title: "Low Stock Alert",
            body: `Product "${product.name}" (SKU: ${product.sku}) is running low on stock. Only ${count} item(s) remaining in stock.`,
            payload: { productId, currentStock: count },
          },
        });
      }
    }
  };

  const ctx = peekTenantContext();
  if (ctx && ctx.tenantId === tenantId) {
    await execute();
  } else {
    await runWithTenant(
      {
        tenantId,
        userId: "system",
        isSuperAdmin: false,
      },
      execute
    );
  }
}
