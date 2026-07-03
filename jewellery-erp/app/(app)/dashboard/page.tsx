import { withTenant } from "@/lib/auth/with-tenant";
import { authorize } from "@/lib/rbac/authorize";
import { getDashboardStatsQuery } from "@/lib/db/queries/dashboard";
import { DashboardClientWrapper } from "./_components/dashboard-client-wrapper";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  return withTenant(async (ctx) => {
    // 1. Authorize dashboard:read permission
    await authorize("dashboard:read");

    // 2. Fetch aggregated dashboard statistics
    const data = await getDashboardStatsQuery(ctx.tenantId);

    return <DashboardClientWrapper data={data} tenantId={ctx.tenantId} />;
  });
}
