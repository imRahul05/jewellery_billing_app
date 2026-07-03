import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

const TenantUpdateSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  gstin: z.string().nullable().optional(),
  pan: z.string().nullable().optional(),
  contactEmail: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

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
            roles: {
              where: { deletedAt: null },
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

        const serializedRoles = tenant.roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
        }));

        return NextResponse.json({
          data: {
            tenant: serializedTenant,
            memberships: serializedMemberships,
            roles: serializedRoles,
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
    const result = TenantUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, slug, gstin, pan, contactEmail, contactPhone, isActive } = result.data;

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        // Fetch current state for audit log and existence check
        const currentTenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            name: true,
            slug: true,
            gstin: true,
            pan: true,
            contactEmail: true,
            contactPhone: true,
            isActive: true,
          },
        });

        if (!currentTenant) {
          return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Slug uniqueness check
        if (slug && slug !== currentTenant.slug) {
          const existingTenant = await prisma.tenant.findFirst({
            where: { slug, id: { not: tenantId } },
          });
          if (existingTenant) {
            return NextResponse.json({ error: "Slug is already in use by another business" }, { status: 400 });
          }
        }

        // Construct update object safely without `any`
        const updateData: {
          name?: string;
          slug?: string;
          gstin?: string | null;
          pan?: string | null;
          contactEmail?: string | null;
          contactPhone?: string | null;
          isActive?: boolean;
        } = {};

        if (name !== undefined) updateData.name = name;
        if (slug !== undefined) updateData.slug = slug;
        if (gstin !== undefined) updateData.gstin = gstin === "" ? null : gstin;
        if (pan !== undefined) updateData.pan = pan === "" ? null : pan;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail === "" ? null : contactEmail;
        if (contactPhone !== undefined) updateData.contactPhone = contactPhone === "" ? null : contactPhone;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedTenant = await prisma.tenant.update({
          where: { id: tenantId },
          data: updateData,
        });

        // Write audit log
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorUserId: session.userId,
            action: AuditAction.update,
            entityType: "Tenant",
            entityId: tenantId,
            before: currentTenant,
            after: updateData,
          },
        });

        // Invalidate Next.js cache for the tenant instantly
        revalidateTag(`tenant-${tenantId}`, { expire: 0 });

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
