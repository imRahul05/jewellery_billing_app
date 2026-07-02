"use client";
import { useEffect } from "react";
import { useTenantStore } from "@/lib/stores/tenant-store";
export function TenantHydrator({ tenant }: { tenant: { id: string; name: string } }) {
  const setTenant = useTenantStore((state) => state.setTenant);
  useEffect(() => setTenant(tenant), [setTenant, tenant]);
  return null;
}
