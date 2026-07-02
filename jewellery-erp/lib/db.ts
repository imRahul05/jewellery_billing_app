import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { peekTenantContext } from "@/lib/db/tenant-context";

// Prisma 7 requires a driver adapter. Runtime uses the POOLED Neon connection.
const connectionString = process.env.DATABASE_URL ?? "";

/**
 * Models that are NOT tenant-scoped and therefore bypass the isolation
 * interceptor (doc 05 §7.3):
 *
 *  - Platform/global catalogs: Plan, Permission, HsnCode.
 *  - Identity/tenant roots resolved BEFORE context is bound: Tenant, User,
 *    UserTenantMembership (session resolution walks these to FIND the tenant).
 *  - RBAC join/config rows keyed via their parents, not a `tenant_id` column:
 *    Role, RolePermission, UserRole, BusinessSetting, Subscription.
 *  - Tenant-NULLABLE audit/config: FeatureFlag, AuditLog, FileAsset — callers
 *    pass `tenantId` explicitly; we never auto-inject on a nullable column.
 *
 * Everything else carries a required `tenant_id` and is force-scoped.
 */
const GLOBAL_MODELS = new Set<string>([
  "Plan",
  "Permission",
  "HsnCode",
  "Tenant",
  "User",
  "UserTenantMembership",
  "Role",
  "RolePermission",
  "UserRole",
  "BusinessSetting",
  "Subscription",
  "FeatureFlag",
  "AuditLog",
  "FileAsset",
]);

/** Read ops we inject a `tenantId` filter into. */
const READ_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

/** Mutations whose `where` we constrain to the active tenant. */
const WRITE_WHERE_OPS = new Set([
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/** Creates that we stamp with the active tenant. */
const CREATE_OPS = new Set(["create", "createMany", "upsert"]);

/**
 * Reject a client-supplied `tenantId` in `where`/`data` that does not match the
 * session tenant — a spoof attempt (doc 05 AC-7). A matching value is allowed
 * (idempotent). Recurses one level into `data.create`/nested-where is out of
 * scope here; direct top-level checks cover the isolation acceptance tests.
 */
function assertNoTenantSpoof(obj: unknown, tenantId: string, where: string) {
  if (obj && typeof obj === "object" && "tenantId" in obj) {
    const supplied = (obj as { tenantId?: unknown }).tenantId;
    if (typeof supplied === "string" && supplied !== tenantId) {
      throw new Error(
        `Cross-tenant ${where} rejected: supplied tenantId does not match session tenant.`,
      );
    }
  }
}

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString });
  const base = new PrismaClient({ adapter });

  return base.$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          // Global/identity models never get tenant injection.
          if (GLOBAL_MODELS.has(model)) return query(args);

          const ctx = peekTenantContext();

          // Super-admin runs unscoped (platform maintenance paths).
          if (ctx?.isSuperAdmin) return query(args);

          // Scoped model touched with no context bound → hard fail. A tenant
          // query must never run unscoped (doc 05 AC-13).
          if (!ctx) {
            throw new Error(
              `Tenant-scoped model "${model}" queried without tenant context (op: ${operation}).`,
            );
          }

          const tenantId = ctx.tenantId;
          const a = (args ?? {}) as Record<string, unknown>;

          if (READ_OPS.has(operation)) {
            assertNoTenantSpoof(a.where, tenantId, "read");
            return query({
              ...a,
              where: { ...(a.where as object), tenantId },
            });
          }

          if (WRITE_WHERE_OPS.has(operation)) {
            assertNoTenantSpoof(a.where, tenantId, "write");
            return query({
              ...a,
              where: { ...(a.where as object), tenantId },
            });
          }

          if (CREATE_OPS.has(operation)) {
            if (operation === "createMany") {
              const data = a.data;
              const rows = Array.isArray(data) ? data : [data];
              for (const row of rows) assertNoTenantSpoof(row, tenantId, "create");
              return query({
                ...a,
                data: rows.map((row) => ({ ...(row as object), tenantId })),
              });
            }
            if (operation === "upsert") {
              assertNoTenantSpoof(a.where, tenantId, "upsert");
              assertNoTenantSpoof(a.create, tenantId, "upsert");
              assertNoTenantSpoof(a.update, tenantId, "upsert");
              return query({
                ...a,
                where: { ...(a.where as object), tenantId },
                create: { ...(a.create as object), tenantId },
                update: { ...(a.update as object) },
              });
            }
            // create
            assertNoTenantSpoof(a.data, tenantId, "create");
            return query({
              ...a,
              data: { ...(a.data as object), tenantId },
            });
          }

          return query(args);
        },
      },
    },
  });
}

export type Db = ReturnType<typeof createPrismaClient>;

// Singleton to avoid exhausting connections during dev hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: Db | undefined;
};

export const prisma: Db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
