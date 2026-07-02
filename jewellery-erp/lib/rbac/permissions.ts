import { cache } from "react";
import { prisma } from "@/lib/db";

interface UserContext {
  userId: string;
  tenantId: string;
}

/**
 * Loads the effective permission set for (userId, tenantId), cached once per request.
 * Super Admins bypass tenant checks and resolve to platform permissions.
 */
export const getEffectivePermissions = cache(
  async (userId: string, tenantId: string): Promise<Set<string>> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });

    if (user?.isSuperAdmin) {
      // Platform permissions only; tenant business data requires explicit impersonation.
      const platformPerms = await prisma.permission.findMany({
        where: { module: { in: ["Super Admin", "Authentication"] } },
        select: { key: true },
      });
      return new Set(platformPerms.map((p) => p.key));
    }

    // Load permissions through the user's memberships and roles in this tenant
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          tenantId,
          userRoles: {
            some: {
              membership: {
                userId,
                tenantId,
                isActive: true,
              },
            },
          },
        },
      },
      select: {
        permission: {
          select: {
            key: true,
          },
        },
      },
    });

    return new Set(rolePermissions.map((rp) => rp.permission.key));
  }
);

/**
 * Check if the user has the specified permission in the active tenant.
 */
export async function hasPermission(
  ctx: UserContext,
  permission: string
): Promise<boolean> {
  const perms = await getEffectivePermissions(ctx.userId, ctx.tenantId);
  return perms.has(permission);
}
