import { api } from "./http";
import type { DashboardData } from "@/lib/db/queries/dashboard";

export const dashboardApi = {
  getStats: () => api.get<DashboardData>("/dashboard"),
};
