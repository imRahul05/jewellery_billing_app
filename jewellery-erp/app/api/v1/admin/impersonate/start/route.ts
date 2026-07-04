import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/logger";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    cookieStore.set("acting_tenant_id", tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 hour impersonation window
    });

    await writeAuditLog({
      action: "create",
      entityType: "Impersonation",
      entityId: tenantId,
      actorUserId: session.userId,
      tenantId: null,
      after: { tenantName: tenant.name, tenantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/v1/admin/impersonate/start error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
