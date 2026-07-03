import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { z } from "zod";

const AddMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  roleId: z.string().min(1, "Role is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export async function POST(
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
    const result = AddMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, fullName, roleId, password: inputPassword } = result.data;
    const password = inputPassword || Math.random().toString(36).slice(-8) + "Aa1!";

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        // 1. Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
        });
        if (!tenant) {
          return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // 2. Verify role exists in the tenant
        const role = await prisma.role.findFirst({
          where: { id: roleId, tenantId, deletedAt: null },
        });
        if (!role) {
          return NextResponse.json({ error: "Selected role does not exist in this business" }, { status: 400 });
        }

        // 3. Check if user already exists in local database
        const user = await prisma.user.findUnique({
          where: { email },
        });

        let authUserId = user?.authUserId || "";

        // 4. If user does not exist in local database, register in Neon Auth (Better Auth)
        if (!user) {
          const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL || "http://localhost:3000";
          const signupUrl = `${neonAuthBaseUrl}/sign-up/email`;

          const signupRes = await fetch(signupUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              name: fullName,
            }),
          });

          const signupData = await signupRes.json();
          if (!signupRes.ok || signupData.error) {
            return NextResponse.json(
              { error: signupData.error?.message || "Failed to register user in authentication system" },
              { status: signupRes.status || 400 }
            );
          }

          authUserId = signupData.user.id;
        }

        // 5. In a transaction, create User (if needed), Membership, and UserRole mapping
        const membershipResult = await prisma.$transaction(async (tx) => {
          // Upsert the user projection to make sure we have it
          const dbUser = await tx.user.upsert({
            where: { email },
            create: {
              authUserId,
              email,
              fullName,
            },
            update: {
              fullName, // Update full name if it was updated
            },
          });

          // Check if membership already exists
          const existingMembership = await tx.userTenantMembership.findUnique({
            where: {
              tenantId_userId: {
                tenantId,
                userId: dbUser.id,
              },
            },
          });

          if (existingMembership && existingMembership.isActive) {
            throw new Error("User is already an active member of this business");
          }

          const membership = await tx.userTenantMembership.upsert({
            where: {
              tenantId_userId: {
                tenantId,
                userId: dbUser.id,
              },
            },
            create: {
              tenantId,
              userId: dbUser.id,
              isActive: true,
              joinedAt: new Date(),
            },
            update: {
              isActive: true,
              joinedAt: new Date(),
            },
          });

          // Assign selected role
          await tx.userRole.upsert({
            where: {
              membershipId_roleId: {
                membershipId: membership.id,
                roleId,
              },
            },
            create: {
              membershipId: membership.id,
              roleId,
            },
            update: {},
          });

          // Write audit log for member creation
          await tx.auditLog.create({
            data: {
              tenantId,
              actorUserId: session.userId,
              action: AuditAction.create,
              entityType: "UserTenantMembership",
              entityId: membership.id,
              after: {
                userId: dbUser.id,
                email,
                roleId,
              },
            },
          });

          // Write audit log for role assignment
          await tx.auditLog.create({
            data: {
              tenantId,
              actorUserId: session.userId,
              action: AuditAction.create,
              entityType: "UserRole",
              entityId: `${membership.id}-${roleId}`,
              after: {
                membershipId: membership.id,
                userId: dbUser.id,
                roleId,
              },
            },
          });

          return {
            membership,
            dbUser,
          };
        });

        // 6. Return the serialized membership
        const responseData = {
          id: membershipResult.membership.id,
          isActive: membershipResult.membership.isActive,
          joinedAt: membershipResult.membership.joinedAt ? membershipResult.membership.joinedAt.toISOString() : null,
          user: {
            id: membershipResult.dbUser.id,
            email: membershipResult.dbUser.email,
            fullName: membershipResult.dbUser.fullName,
          },
          roles: [role.name],
        };

        return NextResponse.json({ data: responseData });
      }
    );
  } catch (error: unknown) {
    console.error("Failed to add member to business:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
