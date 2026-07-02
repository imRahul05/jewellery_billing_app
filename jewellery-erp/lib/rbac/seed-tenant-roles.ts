import { prisma, type Db } from "@/lib/db";

type TxClient = Omit<Db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface RoleDef {
  name: string;
  description: string;
  permissionKeys: string[];
}

// Role-Permission mapping based on the 26 seeded permission keys in database.
const ROLE_PERMISSIONS: Record<string, RoleDef> = {
  owner: {
    name: "Business Owner",
    description: "Full control of the tenant business, staff, and subscription.",
    permissionKeys: [
      "dashboard:read",
      "customer:read",
      "customer:write",
      "customer:delete",
      "supplier:read",
      "supplier:write",
      "supplier:delete",
      "inventory:read",
      "inventory:write",
      "inventory:adjust",
      "inventory:transfer",
      "inventory:delete",
      "invoice:read",
      "invoice:create",
      "invoice:update",
      "invoice:cancel",
      "payment:record",
      "metal_rate:read",
      "metal_rate:write",
      "report:read",
      "report:export",
      "settings:read",
      "settings:write",
      "user:manage",
      "role:manage",
      "audit:read",
    ],
  },
  manager: {
    name: "Manager",
    description: "Day-to-day operations including billing, inventory, and reports.",
    permissionKeys: [
      "dashboard:read",
      "customer:read",
      "customer:write",
      "customer:delete",
      "supplier:read",
      "supplier:write",
      "inventory:read",
      "inventory:write",
      "inventory:adjust",
      "inventory:transfer",
      "invoice:read",
      "invoice:create",
      "invoice:update",
      "invoice:cancel",
      "payment:record",
      "metal_rate:read",
      "metal_rate:write",
      "report:read",
      "report:export",
      "settings:read",
      "settings:write",
      "audit:read",
    ],
  },
  cashier: {
    name: "Cashier",
    description: "Point of sale cashier who can issue invoices and record payments.",
    permissionKeys: [
      "dashboard:read",
      "customer:read",
      "customer:write",
      "inventory:read",
      "invoice:read",
      "invoice:create",
      "invoice:update",
      "payment:record",
      "settings:read",
    ],
  },
  inventory_manager: {
    name: "Inventory Manager",
    description: "Manages stock items, categories, suppliers, and daily metal rates.",
    permissionKeys: [
      "dashboard:read",
      "supplier:read",
      "supplier:write",
      "inventory:read",
      "inventory:write",
      "inventory:adjust",
      "inventory:transfer",
      "inventory:delete",
      "metal_rate:read",
      "metal_rate:write",
      "report:read",
      "settings:read",
    ],
  },
  accountant: {
    name: "Accountant",
    description: "Accesses financial statements, gst reports, and manages audit logs.",
    permissionKeys: [
      "dashboard:read",
      "customer:read",
      "supplier:read",
      "inventory:read",
      "invoice:read",
      "invoice:cancel",
      "payment:record",
      "report:read",
      "report:export",
      "settings:read",
      "audit:read",
    ],
  },
};

/**
 * Seed the 5 system roles for a given tenant.
 * Uses a transaction-safe insert.
 */
export async function seedTenantRoles(
  tenantId: string,
  tx: TxClient = prisma as TxClient,
): Promise<void> {
  // Fetch all existing permissions in the DB to obtain their IDs.
  const dbPermissions = await tx.permission.findMany({
    select: { id: true, key: true },
  });

  const permMap = new Map<string, string>(
    dbPermissions.map((p) => [p.key, p.id]),
  );

  const roles: { id: string; name: string }[] = [];

  for (const roleDef of Object.values(ROLE_PERMISSIONS)) {
    // Upsert role using the tenantId_name unique constraint
    const role = await tx.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleDef.name,
        },
      },
      create: {
        tenantId,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
      update: {
        name: roleDef.name,
        description: roleDef.description,
      },
      select: {
        id: true,
        name: true,
      },
    });
    roles.push(role);
  }

  const roleMap = new Map<string, string>(roles.map((r) => [r.name, r.id]));

  // Delete all existing role permissions for these roles in one query
  const roleIds = roles.map((r) => r.id);
  await tx.rolePermission.deleteMany({
    where: {
      roleId: { in: roleIds },
    },
  });

  // Prepare all new role permissions to create in one query
  const rolePermissionsData: { roleId: string; permissionId: string }[] = [];
  for (const roleDef of Object.values(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleDef.name);
    if (!roleId) continue;

    const permissionIds = roleDef.permissionKeys
      .map((k) => permMap.get(k))
      .filter((id): id is string => !!id);

    for (const permissionId of permissionIds) {
      rolePermissionsData.push({
        roleId,
        permissionId,
      });
    }
  }

  if (rolePermissionsData.length > 0) {
    await tx.rolePermission.createMany({
      data: rolePermissionsData,
    });
  }
}
