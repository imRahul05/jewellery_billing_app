import { requireSession } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/rbac/permissions";
import React from "react";

interface CanProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Server Component for conditional rendering based on RBAC permissions.
 *
 * NOTE: Gating in the UI is cosmetic for user experience.
 * Server Actions and Route Handlers must enforce permissions authoritatively.
 */
export async function Can({
  permission,
  children,
  fallback = null,
}: CanProps): Promise<React.ReactElement | null> {
  try {
    const session = await requireSession();
    if (!session) {
      return <>{fallback}</>;
    }

    const perms = await getEffectivePermissions(session.userId, session.tenantId);
    const required = Array.isArray(permission) ? permission : [permission];
    
    // AND semantics: all required permissions must be met
    const allowed = required.every((p) => perms.has(p));

    if (allowed) {
      return <>{children}</>;
    }
    
    return <>{fallback}</>;
  } catch {
    return <>{fallback}</>;
  }
}
