import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { AuditAction } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: tenantId } = await params;

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            memberships: {
              include: {
                user: true,
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        });

        if (!tenant) {
          return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const serializedTenant = {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          gstin: tenant.gstin,
          pan: tenant.pan,
          contactEmail: tenant.contactEmail,
          contactPhone: tenant.contactPhone,
          isActive: tenant.isActive,
          onboardedAt: tenant.onboardedAt ? tenant.onboardedAt.toISOString() : null,
          createdAt: tenant.createdAt.toISOString(),
        };

        const serializedMemberships = tenant.memberships.map((m) => ({
          id: m.id,
          isActive: m.isActive,
          joinedAt: m.joinedAt ? m.joinedAt.toISOString() : null,
          user: {
            id: m.user.id,
            email: m.user.email,
            fullName: m.user.fullName,
          },
          roles: m.userRoles.map((ur) => ur.role.name),
        }));

        return NextResponse.json({
          data: {
            tenant: serializedTenant,
            memberships: serializedMemberships,
          },
        });

      }
    );
  } catch (error: unknown) {
    console.error("Failed to fetch business details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        // Fetch current state for audit log
        const currentTenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { isActive: true },
        });

        if (!currentTenant) {
          return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const updatedTenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: { isActive },
        });

        // Write audit log
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorUserId: session.userId,
            action: AuditAction.update,
            entityType: "Tenant",
            entityId: tenantId,
            before: { isActive: currentTenant.isActive },
            after: { isActive },
          },
        });

        // Invalidate Next.js cache for the tenant instantly
        revalidateTag(`tenant-${tenantId}`);

        return NextResponse.json({
          data: {
            id: updatedTenant.id,
            name: updatedTenant.name,
            slug: updatedTenant.slug,
            gstin: updatedTenant.gstin,
            pan: updatedTenant.pan,
            contactEmail: updatedTenant.contactEmail,
            contactPhone: updatedTenant.contactPhone,
            isActive: updatedTenant.isActive,
            onboardedAt: updatedTenant.onboardedAt ? updatedTenant.onboardedAt.toISOString() : null,
            createdAt: updatedTenant.createdAt.toISOString(),
          },
        });

      }
    );
  } catch (error: unknown) {
    console.error("Failed to update business status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
