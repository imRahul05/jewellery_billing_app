import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const cookieStore = await cookies();

    const actingTenantId = cookieStore.get("acting_tenant_id")?.value;
    cookieStore.delete("acting_tenant_id");

    if (session.isSuperAdmin && actingTenantId) {
      await writeAuditLog({
        action: "delete",
        entityType: "Impersonation",
        entityId: actingTenantId,
        actorUserId: session.userId,
        tenantId: null,
        before: { tenantId: actingTenantId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/v1/admin/impersonate/stop error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
