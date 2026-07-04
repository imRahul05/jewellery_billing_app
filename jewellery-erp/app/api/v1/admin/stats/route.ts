import { NextResponse, connection } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getPlatformStatsQuery } from "@/lib/db/queries/admin-stats";

export async function GET(): Promise<NextResponse> {
  await connection();
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // No runWithTenant needed — getPlatformStatsQuery uses the unscoped
    // prismaAdmin client for cross-tenant aggregate reads.
    const stats = await getPlatformStatsQuery();
    return NextResponse.json({ data: stats });
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
