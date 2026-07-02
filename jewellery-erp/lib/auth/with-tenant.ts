import "server-only";

import { requireSession } from "@/lib/auth/session";
import { runWithTenant, type TenantContext } from "@/lib/db/tenant-context";

/**
 * Resolve the session and run `fn` inside the bound tenant context.
 *
 * This is the correctness-critical entry point for anything touching
 * tenant-scoped data: server actions and server-component data loaders wrap
 * their work in `withTenant()` so the Prisma extension can read the active
 * tenant from `AsyncLocalStorage`.
 *
 * `AsyncLocalStorage` does not reliably propagate across React Server Component
 * segment boundaries, so we bind per call site rather than relying solely on
 * the `(app)` layout.
 */
export async function withTenant<T>(
  fn: (ctx: TenantContext) => Promise<T>,
): Promise<T> {
  const session = await requireSession();
  const ctx: TenantContext = {
    tenantId: session.tenantId,
    userId: session.userId,
    isSuperAdmin: session.isSuperAdmin,
  };
  return runWithTenant(ctx, () => fn(ctx));
}
