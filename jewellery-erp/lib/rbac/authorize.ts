import { requireSession, AuthenticationError, type Session } from "@/lib/auth/session";
import { assertPlanAllows } from "@/lib/billing/entitlements";
import { hasPermission } from "./permissions";

export { AuthenticationError };

export class AuthorizationError extends Error {
  constructor(public permission: string) {
    super(`Forbidden: missing permission "${permission}"`);
    this.name = "AuthorizationError";
  }
}

export function isAuthError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AuthorizationError" || err.name === "AuthenticationError")
  );
}

export function getAuthStatusCode(err: unknown): number {
  if (err instanceof Error) {
    if (err.name === "AuthorizationError") return 403;
    if (err.name === "AuthenticationError") return 401;
  }
  return 500;
}

/**
 * Deny-by-default guard. Resolves session + tenant, checks the permission,
 * and intersects with the tenant's plan entitlements (feature flags/limits).
 * Returns the trusted session context on success; throws otherwise.
 */
export async function authorize(permission: string): Promise<Session> {
  const session = await requireSession({ redirectOnFailure: false });

  // Super Admin bypasses all checks
  if (session.isSuperAdmin) {
    return session;
  }

  // Plan-gated permissions: even if granted by role, plan restrictions override
  await assertPlanAllows(session.tenantId, permission);


  const allowed = await hasPermission(
    { userId: session.userId, tenantId: session.tenantId },
    permission,
  );

  if (!allowed) {
    throw new AuthorizationError(permission);
  }

  return session;
}
