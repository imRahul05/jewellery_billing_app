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

function createClients() {
  const adapter = new PrismaNeon({ connectionString });
  const base = new PrismaClient({ adapter });

  const extended = base.$extends({
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

  return { base, extended };
}

type Clients = ReturnType<typeof createClients>;

export type Db = Clients["extended"];

// Singleton to avoid exhausting connections during dev hot-reload.
const globalForPrisma = globalThis as unknown as {
  __dbClients: Clients | undefined;
};

const clients: Clients = globalForPrisma.__dbClients ?? createClients();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__dbClients = clients;
}

/** Tenant-scoped client — auto-injects tenant_id via ALS context. */
export const prisma: Db = clients.extended;

/**
 * Unscoped Prisma client for platform-wide super-admin queries.
 * Bypasses the tenant isolation interceptor entirely — does NOT rely on ALS.
 * Use ONLY in admin routes that have already verified super-admin access.
 *
 * Why: The Neon serverless HTTP driver's internal fetch() does not propagate
 * AsyncLocalStorage context in Turbopack, so the tenant-scoped client loses
 * the isSuperAdmin flag across await boundaries.
 */
export const prismaAdmin: PrismaClient = clients.base;
