import { connection, NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { getDashboardStatsQuery } from "@/lib/db/queries/dashboard";

export async function GET(): Promise<NextResponse | Response> {
  // Keep Next.js's prerender control signal outside application error handling.
  await connection();
  try {
    // 1. Authorize dashboard:read permission
    const session = await authorize("dashboard:read");

    // 2. Fetch aggregated dashboard stats inside the bound tenant context
    const data = await runWithTenant(session, async () => {
      return await getDashboardStatsQuery(session.tenantId);
    });

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error("GET /api/v1/dashboard error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
