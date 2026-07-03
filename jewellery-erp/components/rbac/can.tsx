"use client";

import React from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";

interface CanProps {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client Component for conditional rendering based on RBAC permissions.
 *
 * NOTE: Gating in the UI is cosmetic for user experience.
 * Server Actions and Route Handlers must enforce permissions authoritatively.
 */
export function Can({
  permission,
  children,
  fallback = null,
}: CanProps): React.JSX.Element | null {
  const permissions = useTenantStore((state) => state.permissions);
  const required = Array.isArray(permission) ? permission : [permission];
  
  // Check if all required permissions are met
  const allowed = required.every((p) => permissions.includes(p));

  if (allowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
