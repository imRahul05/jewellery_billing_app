import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await authorize("audit:read");

    return await runWithTenant(session, async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          tenantId: session.tenantId,
        },
        include: {
          actor: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { occurredAt: "desc" },
        take: 100, // Return up to 100 recent entries for compliance
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
        actor: l.actor ? {
          email: l.actor.email,
          fullName: l.actor.fullName,
        } : null,
      }));

      return NextResponse.json({ data: serialized });
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/audit-logs error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = error instanceof Error && error.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
