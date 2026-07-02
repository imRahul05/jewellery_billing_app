"use client";
import { useEffect } from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";
export function TenantHydrator({
  tenant,
  permissions,
}: {
  tenant: { id: string; name: string };
  permissions: string[];
}) {
  const setTenant = useTenantStore((state) => state.setTenant);
  useEffect(() => setTenant(tenant, permissions), [setTenant, tenant, permissions]);
  return null;
}
