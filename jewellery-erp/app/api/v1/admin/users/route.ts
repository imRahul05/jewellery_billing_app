import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          },
          include: {
            memberships: {
              where: { isActive: true },
              include: {
                tenant: true,
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        const serialized = users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          isSuperAdmin: u.isSuperAdmin,
          createdAt: u.createdAt.toISOString(),
          memberships: u.memberships.map((m) => ({
            id: m.id,
            tenantName: m.tenant.name,
            roles: m.userRoles.map((ur) => ur.role.name),
          })),
        }));

        return NextResponse.json({ data: serialized });
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
