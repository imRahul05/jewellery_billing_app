import { withTenant } from "@/lib/auth/with-tenant";
import { authorize } from "@/lib/rbac/authorize";
import { getReportsQuery } from "@/lib/db/queries/reports";
import { ReportsClientWrapper } from "./_components/reports-client-wrapper";

interface ReportsPageProps {
  searchParams: Promise<{
    range?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const range = params.range || "this_month";

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // Calculate start/end date bounds based on selected range
  if (range === "7d") {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "30d") {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (range === "all") {
    startDate = new Date(2020, 0, 1);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else {
    // default: this_month (1st to last day of current month)
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return withTenant(async (ctx) => {
    // 1. Authorize read reports permission
    await authorize("report:read");

    // 2. Fetch and aggregate report data
    const reports = await getReportsQuery(ctx.tenantId, {
      startDate,
      endDate,
    });

    return (
      <ReportsClientWrapper
        range={range}
        reportData={reports}
        startDateStr={startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        endDateStr={endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      />
    );
  });
}
