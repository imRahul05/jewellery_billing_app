import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request tenant context (doc 05 §7.3).
 *
 * Held in `AsyncLocalStorage` so it flows through async server work without
 * threading it manually. Bound once per request in `(app)/layout.tsx` and in
 * server actions, always AFTER `requireSession()` — the tenant identity comes
 * from the server-resolved session, NEVER from client input.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  isSuperAdmin: boolean;
}

const tenantStore = new AsyncLocalStorage<TenantContext>();

/**
 * Read the active tenant context. Throws when unbound so that a query can
 * never silently run unscoped (doc 05 AC-13). Global-model reads that legitimately
 * run before context is bound should use the raw client paths that bypass the
 * extension (see `GLOBAL_MODELS` in `lib/db.ts`).
 */
export function getTenantContext(): TenantContext {
  const ctx = tenantStore.getStore();
  if (!ctx) {
    throw new Error(
      "No tenant context bound. Call runWithTenant() after requireSession() before touching tenant-scoped data.",
    );
  }
  return ctx;
}

/** Non-throwing variant — for the Prisma extension to decide bypass vs. scope. */
export function peekTenantContext(): TenantContext | undefined {
  return tenantStore.getStore();
}

/** Run `fn` with the given tenant context bound for its entire async lifetime. */
export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return tenantStore.run(ctx, fn);
}
