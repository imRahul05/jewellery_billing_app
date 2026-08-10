/**
 * Script to create and seed the Demo Tenant.
 * Run with: npx tsx scripts/seed-demo-tenant.ts
 *
 * NOTE: Ensure the app is running (pnpm dev) so the auth endpoints are available.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config();

const CONFIG = {
  email: "demo@jewelleryerp.com",
  password: "demo-password-1234",
  ownerName: "Demo User",
  businessName: "Demo Jewellery Store",
};

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function signUpUser(): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const authUrl = `${baseUrl}/api/auth/sign-up/email`;

  console.log(`Attempting to sign up ${CONFIG.email} at ${authUrl}...`);

  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: CONFIG.email,
      password: CONFIG.password,
      name: CONFIG.ownerName,
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    // If already exists, we might need to login to get the user ID, or just query it from db
    if (errorText.includes("already exists") || res.status === 400) {
      console.log("User may already exist in auth provider. We will look up by email.");
      return ""; // Handled below
    }
    throw new Error(`Auth sign-up failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.user?.id || data.id || "";
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set in .env");

  const adapter = new PrismaNeon({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    let authUserId = await signUpUser();
    
    // If sign-up didn't return authUserId (e.g. user exists), log in to get it
    if (!authUserId) {
       const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
       const signinUrl = `${baseUrl}/api/auth/sign-in/email`;
       const signinRes = await fetch(signinUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: CONFIG.email, password: CONFIG.password })
       });
       if (signinRes.ok) {
         const signinData = await signinRes.json();
         authUserId = signinData.user?.id || signinData.id;
         console.log(`Successfully logged in to retrieve authUserId: ${authUserId}`);
       } else {
         const existingUser = await db.user.findUnique({ where: { email: CONFIG.email }});
         if (existingUser) {
            authUserId = existingUser.authUserId;
            console.log(`Found existing user in DB with authUserId: ${authUserId}`);
         } else {
            throw new Error("Could not find authUserId for existing user via login or DB.");
         }
       }
    }

    const slug = slugify(CONFIG.businessName);

    console.log(`\n🚀 Seeding Demo Business: "${CONFIG.businessName}"\n`);

    const result = await db.$transaction(async (tx) => {
      // 1. User
      const user = await tx.user.upsert({
        where: { email: CONFIG.email },
        create: { authUserId, email: CONFIG.email, fullName: CONFIG.ownerName },
        update: { authUserId, fullName: CONFIG.ownerName },
      });

      // 2. Tenant
      let tenant = await tx.tenant.findUnique({ where: { slug } });
      if (!tenant) {
        tenant = await tx.tenant.create({
          data: { name: CONFIG.businessName, slug, isActive: true, onboardedAt: new Date() },
        });
      }

      // 3. Settings
      await tx.businessSetting.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          baseCurrency: "INR",
          defaultGstRate: new Prisma.Decimal(3.0),
          gstRegistered: true,
          makingChargeMode: "per_gram",
        },
        update: {},
      });

      // 4. Membership
      const membership = await tx.userTenantMembership.upsert({
        where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
        create: { tenantId: tenant.id, userId: user.id, isActive: true, joinedAt: new Date() },
        update: { isActive: true },
      });

      // 5. Roles & Permissions
      const ROLE_PERMISSIONS: Record<string, { name: string; description: string; permissionKeys: string[] }> = {
        owner: {
          name: "Business Owner",
          description: "Full control of the tenant business, staff, and subscription.",
          permissionKeys: [
            "dashboard:read", "customer:read", "customer:write", "customer:delete",
            "supplier:read", "supplier:write", "supplier:delete", "inventory:read",
            "inventory:write", "inventory:adjust", "inventory:transfer", "inventory:delete",
            "invoice:read", "invoice:create", "invoice:update", "invoice:cancel",
            "payment:record", "metal_rate:read", "metal_rate:write", "report:read",
            "report:export", "settings:read", "settings:write", "user:manage",
            "role:manage", "audit:read"
          ]
        }
      };

      const dbPermissions = await tx.permission.findMany({ select: { id: true, key: true } });
      const permMap = new Map<string, string>(dbPermissions.map((p) => [p.key, p.id]));

      const ownerDef = ROLE_PERMISSIONS.owner;
      const ownerRole = await tx.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: ownerDef.name } },
        create: { tenantId: tenant.id, name: ownerDef.name, description: ownerDef.description, isSystem: true },
        update: { name: ownerDef.name, description: ownerDef.description },
        select: { id: true }
      });

      await tx.rolePermission.deleteMany({ where: { roleId: ownerRole.id } });
      const permissionIds = ownerDef.permissionKeys.map(k => permMap.get(k)).filter((id): id is string => !!id);
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId: ownerRole.id, permissionId }))
        });
      }

      await tx.userRole.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId: ownerRole.id } },
        create: { membershipId: membership.id, roleId: ownerRole.id },
        update: {},
      });

      // Seed Demo Data

      // Categories
      let catGold = await tx.productCategory.findFirst({
        where: { tenantId: tenant.id, parentId: null, name: "Gold Rings" }
      });
      if (!catGold) {
        catGold = await tx.productCategory.create({
          data: { tenantId: tenant.id, name: "Gold Rings", metalType: "gold" }
        });
      }

      let catSilver = await tx.productCategory.findFirst({
        where: { tenantId: tenant.id, parentId: null, name: "Silver Chains" }
      });
      if (!catSilver) {
        catSilver = await tx.productCategory.create({
          data: { tenantId: tenant.id, name: "Silver Chains", metalType: "silver" }
        });
      }

      // Products
      const prodRing = await tx.product.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: "GR-001" } },
        create: { tenantId: tenant.id, categoryId: catGold.id, sku: "GR-001", name: "22K Gold Wedding Ring", metalType: "gold", defaultPurity: new Prisma.Decimal(91.6), defaultKarat: 22, makingChargeMode: "per_gram", makingChargeValue: new Prisma.Decimal(450) },
        update: {}
      });

      const prodChain = await tx.product.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: "SC-001" } },
        create: { tenantId: tenant.id, categoryId: catSilver.id, sku: "SC-001", name: "925 Silver Chain", metalType: "silver", defaultPurity: new Prisma.Decimal(92.5), makingChargeMode: "flat", makingChargeValue: new Prisma.Decimal(250) },
        update: {}
      });

      // Customers
      const existingCustomer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, phone: "9876543210" }
      });
      if (!existingCustomer) {
        await tx.customer.create({
          data: { tenantId: tenant.id, name: "Alice Smith", phone: "9876543210", email: "alice@example.com", loyaltyPoints: 150 }
        });
      }

      // Suppliers
      let supplier = await tx.supplier.findFirst({
        where: { tenantId: tenant.id, name: "Global Bullion Hub" }
      });
      if (!supplier) {
        supplier = await tx.supplier.create({
          data: { tenantId: tenant.id, name: "Global Bullion Hub", phone: "1234567890", email: "contact@globalbullion.com" }
        });
      }

      // Inventory Items
      await tx.inventoryItem.upsert({
        where: { tenantId_tagNumber: { tenantId: tenant.id, tagNumber: "TAG-G-001" } },
        create: {
          tenantId: tenant.id, productId: prodRing.id, supplierId: supplier.id,
          tagNumber: "TAG-G-001", grossWeight: new Prisma.Decimal(12.500), netWeight: new Prisma.Decimal(12.500),
          purityFineness: new Prisma.Decimal(91.6), karat: 22, quantity: 1, costPrice: new Prisma.Decimal(65000)
        },
        update: {}
      });

      await tx.inventoryItem.upsert({
        where: { tenantId_tagNumber: { tenantId: tenant.id, tagNumber: "TAG-S-001" } },
        create: {
          tenantId: tenant.id, productId: prodChain.id, supplierId: supplier.id,
          tagNumber: "TAG-S-001", grossWeight: new Prisma.Decimal(25.000), netWeight: new Prisma.Decimal(25.000),
          purityFineness: new Prisma.Decimal(92.5), quantity: 5, costPrice: new Prisma.Decimal(1500)
        },
        update: {}
      });

      // Daily Rates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Need to use 00:00:00 for the rateDate unique constraint usually, or just what Prisma passes
      await tx.metalRate.upsert({
        where: { tenantId_metalType_purityFineness_rateDate: { tenantId: tenant.id, metalType: "gold", purityFineness: new Prisma.Decimal(91.6), rateDate: today } },
        create: { tenantId: tenant.id, metalType: "gold", purityFineness: new Prisma.Decimal(91.6), rateDate: today, ratePerGram: new Prisma.Decimal(6800), source: "Market" },
        update: {}
      });

      return { tenantId: tenant.id };
    }, { maxWait: 15000, timeout: 30000 });

    console.log("\n✅ Demo Business seeded successfully!");
    console.log("   Tenant ID:", result.tenantId);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
  } finally {
    await db.$disconnect();
  }
}

main();
