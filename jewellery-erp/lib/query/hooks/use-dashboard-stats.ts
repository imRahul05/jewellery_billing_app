"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { dashboardApi } from "@/lib/api/dashboard.api";
import type { DashboardData } from "@/lib/db/queries/dashboard";

export type { DashboardData };

async function fetchDashboardStats(): Promise<DashboardData> {
  const res = await dashboardApi.getStats();
  return res.data;
}

export function useDashboardStats(tenantId: string) {
  return useQuery({
    queryKey: qk.dashboard.stats(tenantId),
    queryFn: fetchDashboardStats,
    enabled: Boolean(tenantId),
  });
}

