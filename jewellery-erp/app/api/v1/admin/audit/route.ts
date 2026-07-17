import { NextResponse, connection } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { Prisma, AuditAction } from "@prisma/client";

export async function GET(request: Request): Promise<NextResponse> {
  await connection();
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const search = searchParams.get("search") || "";

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const where: Prisma.AuditLogWhereInput = {};

        if (search) {
          const term = search.toLowerCase();
          const orConditions: Prisma.AuditLogWhereInput[] = [
            { entityType: { contains: term, mode: "insensitive" } },
            { entityId: { contains: term, mode: "insensitive" } },
            {
              tenant: {
                name: { contains: term, mode: "insensitive" },
              },
            },
            {
              actor: {
                OR: [
                  { email: { contains: term, mode: "insensitive" } },
                  { fullName: { contains: term, mode: "insensitive" } },
                ],
              },
            },
          ];

          // Check if term matches any AuditAction enum values
          const matchAction = Object.values(AuditAction).find((act) =>
            act.toLowerCase().includes(term)
          );
          if (matchAction) {
            orConditions.push({ action: matchAction });
          }

          where.OR = orConditions;
        }

        const [logs, totalCount] = await Promise.all([
          prisma.auditLog.findMany({
            where,
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
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.auditLog.count({ where }),
        ]);

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
          actor: l.actor
            ? {
                email: l.actor.email,
                fullName: l.actor.fullName,
              }
            : null,
        }));

        return NextResponse.json({
          data: serialized,
          meta: { count: totalCount },
        });
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/audit error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
