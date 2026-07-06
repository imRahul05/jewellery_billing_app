/**
 * Standalone script to create a business tenant.
 * Run with: npx tsx scripts/create-business.ts
 *
 * This intentionally uses a raw PrismaClient (NOT lib/db.ts) so it works
 * outside Next.js (no server-only, no tenant-context middleware).
 */

import { PrismaClient, AuditAction, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config(); // load .env

// ─── Config: edit these before running ──────────────────────────────────────
const CONFIG = {
  authUserId: "513eb0f7-5e35-4444-8e71-10afde0259bb",
  email: "akashraj1113@gmail.com",
  ownerName: "Aakash",
  businessName: "Brahmdev prasad jewellers",
} as const;
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<
  string,
  { name: string; description: string; permissionKeys: string[] }
> = {
  owner: {
    name: "Business Owner",
    description: "Full control of the tenant business, staff, and subscription.",
    permissionKeys: [
      "dashboard:read", "customer:read", "customer:write", "customer:delete",
      "supplier:read", "supplier:write", "supplier:delete",
      "inventory:read", "inventory:write", "inventory:adjust", "inventory:transfer", "inventory:delete",
      "invoice:read", "invoice:create", "invoice:update", "invoice:cancel",
      "payment:record", "metal_rate:read", "metal_rate:write",
      "report:read", "report:export", "settings:read", "settings:write",
      "user:manage", "role:manage", "audit:read",
    ],
  },
  manager: {
    name: "Manager",
    description: "Day-to-day operations including billing, inventory, and reports.",
    permissionKeys: [
      "dashboard:read", "customer:read", "customer:write", "customer:delete",
      "supplier:read", "supplier:write",
      "inventory:read", "inventory:write", "inventory:adjust", "inventory:transfer",
      "invoice:read", "invoice:create", "invoice:update", "invoice:cancel",
      "payment:record", "metal_rate:read", "metal_rate:write",
      "report:read", "report:export", "settings:read", "settings:write", "audit:read",
    ],
  },
  cashier: {
    name: "Cashier",
    description: "Point of sale cashier who can issue invoices and record payments.",
    permissionKeys: [
      "dashboard:read", "customer:read", "customer:write",
      "inventory:read", "invoice:read", "invoice:create", "invoice:update",
      "payment:record", "settings:read",
    ],
  },
  inventory_manager: {
    name: "Inventory Manager",
    description: "Manages stock items, categories, suppliers, and daily metal rates.",
    permissionKeys: [
      "dashboard:read", "supplier:read", "supplier:write",
      "inventory:read", "inventory:write", "inventory:adjust", "inventory:transfer", "inventory:delete",
      "metal_rate:read", "metal_rate:write", "report:read", "settings:read",
    ],
  },
  accountant: {
    name: "Accountant",
    description: "Accesses financial statements, gst reports, and manages audit logs.",
    permissionKeys: [
      "dashboard:read", "customer:read", "supplier:read", "inventory:read",
      "invoice:read", "invoice:cancel", "payment:record",
      "report:read", "report:export", "settings:read", "audit:read",
    ],
  },
};

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set in .env");

  const adapter = new PrismaNeon({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const { authUserId, email, ownerName, businessName } = CONFIG;
    const slug = `${slugify(businessName) || "business"}-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`\n🚀 Creating business: "${businessName}" for ${email}\n`);

    const result = await db.$transaction(async (tx) => {
      // 1. Upsert User projection
      const user = await tx.user.upsert({
        where: { email },
        create: { authUserId, email, fullName: ownerName },
        update: { authUserId, fullName: ownerName },
      });
      console.log("   ✓ User upserted:", user.id);

      // 2. Create Tenant
      const tenant = await tx.tenant.create({
        data: { name: businessName, slug, isActive: true, onboardedAt: new Date() },
      });
      console.log("   ✓ Tenant created:", tenant.id);

      // 3. Default BusinessSetting
      await tx.businessSetting.create({
        data: {
          tenantId: tenant.id,
          baseCurrency: "INR",
          defaultGstRate: new Prisma.Decimal(3.0),
          gstRegistered: true,
          makingChargeMode: "per_gram",
          defaultMakingCharge: new Prisma.Decimal(0.0),
          invoicePrefix: "INV",
          invoiceNextSeq: BigInt(1),
          financialYearStartMonth: 4,
        },
      });
      console.log("   ✓ BusinessSetting created");

      // 4. Seed roles & permissions
      const dbPermissions = await tx.permission.findMany({ select: { id: true, key: true } });
      const permMap = new Map(dbPermissions.map((p) => [p.key, p.id]));

      const roles: { id: string; name: string }[] = [];
      for (const roleDef of Object.values(ROLE_PERMISSIONS)) {
        const role = await tx.role.upsert({
          where: { tenantId_name: { tenantId: tenant.id, name: roleDef.name } },
          create: { tenantId: tenant.id, name: roleDef.name, description: roleDef.description, isSystem: true },
          update: { name: roleDef.name, description: roleDef.description },
          select: { id: true, name: true },
        });
        roles.push(role);
      }

      const roleMap = new Map(roles.map((r) => [r.name, r.id]));
      const roleIds = roles.map((r) => r.id);
      await tx.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } });

      const rolePermissionsData: { roleId: string; permissionId: string }[] = [];
      for (const roleDef of Object.values(ROLE_PERMISSIONS)) {
        const roleId = roleMap.get(roleDef.name);
        if (!roleId) continue;
        for (const key of roleDef.permissionKeys) {
          const permissionId = permMap.get(key);
          if (permissionId) rolePermissionsData.push({ roleId, permissionId });
        }
      }
      if (rolePermissionsData.length > 0) {
        await tx.rolePermission.createMany({ data: rolePermissionsData });
      }
      console.log("   ✓ Roles & permissions seeded");

      // 5. Membership
      const membership = await tx.userTenantMembership.create({
        data: { tenantId: tenant.id, userId: user.id, isActive: true, joinedAt: new Date() },
      });

      // 6. Assign Owner role
      const ownerRole = await tx.role.findFirstOrThrow({
        where: { tenantId: tenant.id, name: "Business Owner" },
      });
      await tx.userRole.create({ data: { membershipId: membership.id, roleId: ownerRole.id } });
      console.log("   ✓ Membership & Owner role assigned");

      // 7. Audit logs
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorUserId: user.id,
          action: AuditAction.create,
          entityType: "Tenant",
          entityId: tenant.id,
          after: { name: tenant.name, slug: tenant.slug },
        },
      });

      return { userId: user.id, tenantId: tenant.id, membershipId: membership.id };
    }, { maxWait: 15000, timeout: 30000 });

    console.log("\n✅ Business created successfully!");
    console.log("   Tenant ID    :", result.tenantId);
    console.log("   User ID      :", result.userId);
    console.log("   Membership ID:", result.membershipId);
    console.log("\n📋 Next steps:");
    console.log("   1. Share login credentials with the business owner");
    console.log("   2. They log in at /login → select their business → fill GST details in Settings");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("\n❌ Failed to create business:", err);
  process.exit(1);
});