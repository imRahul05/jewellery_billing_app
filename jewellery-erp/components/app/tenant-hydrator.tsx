"use client";
import { useEffect } from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";
export function TenantHydrator({
  tenant,
  permissions,
  isSuperAdmin,
}: {
  tenant: { id: string; name: string };
  permissions: string[];
  isSuperAdmin: boolean;
}) {
  const setTenant = useTenantStore((state) => state.setTenant);
  useEffect(() => setTenant(tenant, permissions, isSuperAdmin), [setTenant, tenant, permissions, isSuperAdmin]);
  return null;
}

