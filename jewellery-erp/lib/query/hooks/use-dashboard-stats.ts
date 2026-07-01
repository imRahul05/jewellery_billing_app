"use client";

import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";

/**
 * Sample server-state hook. Components consume hooks like this — they never
 * call fetch/Prisma directly on the client.
 *
 * The billing/reporting endpoints don't exist yet (later phases); this returns
 * a typed placeholder so the Query wiring is exercised end-to-end today.
 */
export interface DashboardStats {
  todaysSales: number;
  outstanding: number;
  stockValue: number;
  lowStockCount: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // TODO(billing/reports phase): replace with real API call.
  return {
    todaysSales: 0,
    outstanding: 0,
    stockValue: 0,
    lowStockCount: 0,
  };
}

export function useDashboardStats(tenantId: string) {
  return useQuery({
    queryKey: qk.dashboard.stats(tenantId),
    queryFn: fetchDashboardStats,
    enabled: Boolean(tenantId),
  });
}
