import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { getPlatformStatsQuery } from "@/lib/db/queries/admin-stats";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const stats = await getPlatformStatsQuery();
        return NextResponse.json({ data: stats });
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
