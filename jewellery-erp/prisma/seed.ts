import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Migrations/seed use the DIRECT connection when available.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Global catalog permissions (doc 03 §14, doc 07 nav perms, doc 06 RBAC).
 * Keyed by `key` — upsert makes re-runs idempotent.
 */
const PERMISSIONS: Array<{ key: string; module: string; description: string }> = [
  // Dashboard
  { key: "dashboard:read", module: "dashboard", description: "View dashboard" },
  // Customers
  { key: "customer:read", module: "customers", description: "View customers" },
  { key: "customer:write", module: "customers", description: "Create/edit customers" },
  { key: "customer:delete", module: "customers", description: "Delete customers" },
  // Suppliers
  { key: "supplier:read", module: "suppliers", description: "View suppliers" },
  { key: "supplier:write", module: "suppliers", description: "Create/edit suppliers" },
  { key: "supplier:delete", module: "suppliers", description: "Delete suppliers" },
  // Inventory
  { key: "inventory:read", module: "inventory", description: "View inventory" },
  { key: "inventory:write", module: "inventory", description: "Create/edit inventory" },
  { key: "inventory:adjust", module: "inventory", description: "Adjust stock" },
  { key: "inventory:transfer", module: "inventory", description: "Transfer stock" },
  { key: "inventory:delete", module: "inventory", description: "Delete inventory" },
  // Billing / invoices
  { key: "invoice:read", module: "billing", description: "View invoices" },
  { key: "invoice:create", module: "billing", description: "Create invoices" },
  { key: "invoice:update", module: "billing", description: "Edit invoices" },
  { key: "invoice:cancel", module: "billing", description: "Cancel/void invoices" },
  { key: "payment:record", module: "billing", description: "Record payments" },
  // Pricing
  { key: "metal_rate:read", module: "pricing", description: "View metal rates" },
  { key: "metal_rate:write", module: "pricing", description: "Set metal rates" },
  // Reports
  { key: "report:read", module: "reports", description: "View reports" },
  { key: "report:export", module: "reports", description: "Export reports" },
  // Settings
  { key: "settings:read", module: "settings", description: "View settings" },
  { key: "settings:write", module: "settings", description: "Edit settings" },
  { key: "user:manage", module: "settings", description: "Manage users" },
  { key: "role:manage", module: "settings", description: "Manage roles" },
  // Audit
  { key: "audit:read", module: "audit", description: "View audit logs" },
];

/** Subscription plans (free / growth / enterprise). Keyed by `code`. */
const PLANS: Array<{
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxUsers: number | null;
  maxInvoicesMonthly: number | null;
  features: Record<string, boolean>;
}> = [
  {
    code: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 2,
    maxInvoicesMonthly: 50,
    features: { inventory: true, gst: true, reports: false, multiUser: false },
  },
  {
    code: "growth",
    name: "Growth",
    priceMonthly: 1499,
    priceYearly: 14990,
    maxUsers: 10,
    maxInvoicesMonthly: 2000,
    features: { inventory: true, gst: true, reports: true, multiUser: true },
  },
  {
    code: "enterprise",
    name: "Enterprise",
    priceMonthly: 4999,
    priceYearly: 49990,
    maxUsers: null,
    maxInvoicesMonthly: null,
    features: { inventory: true, gst: true, reports: true, multiUser: true, api: true },
  },
];

/** Jewellery HSN codes (Chapter 71). Keyed by `code`. */
const HSN_CODES: Array<{ code: string; description: string; defaultGstPercent: number }> = [
  { code: "7113", description: "Articles of jewellery of precious metal", defaultGstPercent: 3.0 },
  { code: "7114", description: "Articles of goldsmiths' or silversmiths' wares", defaultGstPercent: 3.0 },
  { code: "7106", description: "Silver (including plated) unwrought/semi-manufactured", defaultGstPercent: 3.0 },
  { code: "7108", description: "Gold (including plated) unwrought/semi-manufactured", defaultGstPercent: 3.0 },
  { code: "7118", description: "Coin", defaultGstPercent: 3.0 },
  { code: "7117", description: "Imitation jewellery", defaultGstPercent: 3.0 },
];

/** Baseline global feature flags. Keyed by (key, tenantId=null). */
const FEATURE_FLAGS: Array<{ key: string; description: string; isEnabled: boolean }> = [
  { key: "billing.gst_einvoice", description: "GST e-invoicing integration", isEnabled: false },
  { key: "inventory.barcode", description: "Barcode/tag scanning", isEnabled: true },
  { key: "reports.advanced", description: "Advanced analytics reports", isEnabled: false },
];

async function main() {
  // Permissions -------------------------------------------------------------
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { module: p.module, description: p.description },
      create: p,
    });
  }

  // Plans -------------------------------------------------------------------
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxUsers: p.maxUsers,
        maxInvoicesMonthly: p.maxInvoicesMonthly,
        features: p.features,
      },
      create: {
        code: p.code,
        name: p.name,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        maxUsers: p.maxUsers,
        maxInvoicesMonthly: p.maxInvoicesMonthly,
        features: p.features,
      },
    });
  }

  // HSN codes ---------------------------------------------------------------
  for (const h of HSN_CODES) {
    await prisma.hsnCode.upsert({
      where: { code: h.code },
      update: { description: h.description, defaultGstPercent: h.defaultGstPercent },
      create: h,
    });
  }

  // Feature flags (global: tenantId = null) ---------------------------------
  // Composite unique is (key, tenantId); null tenantId can't use a plain
  // findUnique, so guard with find-then-create for idempotency.
  for (const f of FEATURE_FLAGS) {
    const existing = await prisma.featureFlag.findFirst({
      where: { key: f.key, tenantId: null },
    });
    if (existing) {
      await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { description: f.description, isEnabled: f.isEnabled },
      });
    } else {
      await prisma.featureFlag.create({
        data: { key: f.key, description: f.description, isEnabled: f.isEnabled },
      });
    }
  }

  console.log(
    `Seed complete: ${PERMISSIONS.length} permissions, ${PLANS.length} plans, ` +
      `${HSN_CODES.length} HSN codes, ${FEATURE_FLAGS.length} feature flags.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
