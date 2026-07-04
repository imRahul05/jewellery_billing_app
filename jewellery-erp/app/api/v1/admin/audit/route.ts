import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { connection } from "next/server";

export async function GET(request: Request): Promise<NextResponse> {
  await connection();
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const logs = await prisma.auditLog.findMany({
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
            actor: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { occurredAt: "desc" },
          take: 100,
        });

        const serialized = logs.map((l) => ({
          id: l.id,
          occurredAt: l.occurredAt.toISOString(),
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          requestId: l.requestId,
          before: l.before ? JSON.parse(JSON.stringify(l.before)) : null,
          after: l.after ? JSON.parse(JSON.stringify(l.after)) : null,
          tenantName: l.tenant ? l.tenant.name : "Platform / Global",
          actor: l.actor ? {
            email: l.actor.email,
            fullName: l.actor.fullName,
          } : null,
        }));

        return NextResponse.json({ data: serialized });
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/audit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
