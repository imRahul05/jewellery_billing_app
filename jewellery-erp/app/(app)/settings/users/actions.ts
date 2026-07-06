"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/rbac/authorize";
import { AuditAction } from "@prisma/client";
import { cookies } from "next/headers";

const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
});

const RoleActionSchema = z.object({
  membershipId: z.string().min(1),
  roleId: z.string().min(1),
});

const DeactivateSchema = z.object({
  membershipId: z.string().min(1),
});

/**
 * Invite a new user to the tenant business.
 */
export async function inviteUser(
  raw: unknown,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await authorize("user:manage");
    const input = InviteUserSchema.parse(raw);

    // Verify role exists and is in the active tenant
    const role = await prisma.role.findFirst({
      where: { id: input.roleId, tenantId: session.tenantId, deletedAt: null },
    });

    if (!role) {
      return { error: "Selected role does not exist in this business." };
    }

    // Check if membership already exists
    const existingMember = await prisma.user.findFirst({
      where: {
        email: input.email,
        memberships: {
          some: {
            tenantId: session.tenantId,
            isActive: true,
          },
        },
      },
    });

    if (existingMember) {
      return { error: "User is already an active member of this business." };
    }

    // Generate secure token
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: session.tenantId,
        email: input.email,
        roleId: input.roleId,
        token,
        status: "pending",
        invitedById: session.userId,
        expiresAt,
      },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actorUserId: session.userId,
        action: AuditAction.create,
        entityType: "Invitation",
        entityId: invitation.id,
        after: {
          email: invitation.email,
          roleId: invitation.roleId,
          expiresAt: invitation.expiresAt,
        },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Invite user action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to invite user" };
  }
}

/**
 * Claim/accept an invitation to join a tenant.
 */
export async function acceptInvite(
  token: string,
): Promise<{ success?: boolean; tenantId?: string; error?: string }> {
  try {
    // 1. Fetch active session from Neon Auth
    const { data: neonSession } = await auth.getSession();
    if (!neonSession?.user) {
      return { error: "Please sign in or sign up first to accept this invitation." };
    }

    // 2. Resolve invitation details
    const invitation = await prisma.invitation.findFirst({
      where: { token, status: "pending" },
      include: { tenant: true },
    });

    if (!invitation) {
      return { error: "Invitation not found or has already been accepted." };
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      return { error: "This invitation has expired." };
    }

    // 3. Create or update user projection
    const user = await prisma.user.upsert({
      where: { email: neonSession.user.email },
      create: {
        authUserId: neonSession.user.id,
        email: neonSession.user.email,
        fullName: neonSession.user.name || "",
      },
      update: {
        authUserId: neonSession.user.id,
      },
    });

    // 4. Create membership and roles in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Upsert membership
      const membership = await tx.userTenantMembership.upsert({
        where: {
          tenantId_userId: {
            tenantId: invitation.tenantId,
            userId: user.id,
          },
        },
        create: {
          tenantId: invitation.tenantId,
          userId: user.id,
          isActive: true,
          joinedAt: new Date(),
        },
        update: {
          isActive: true,
          joinedAt: new Date(),
        },
      });

      // Assign invitation role
      await tx.userRole.upsert({
        where: {
          membershipId_roleId: {
            membershipId: membership.id,
            roleId: invitation.roleId,
          },
        },
        create: {
          membershipId: membership.id,
          roleId: invitation.roleId,
        },
        update: {},
      });

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: invitation.tenantId,
          actorUserId: user.id,
          action: AuditAction.create,
          entityType: "UserTenantMembership",
          entityId: membership.id,
          after: {
            userId: user.id,
            roleId: invitation.roleId,
          },
        },
      });

      return { membershipId: membership.id, tenantId: invitation.tenantId };
    });

    // 5. Set active tenant cookie
    const cookieStore = await cookies();
    cookieStore.set("current_tenant_id", result.tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return { success: true, tenantId: result.tenantId };
  } catch (err: unknown) {
    console.error("Accept invitation action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to accept invitation" };
  }
}

/**
 * Helper to check if a user is the last owner.
 */
async function assertNotLastOwner(tenantId: string, membershipId: string): Promise<void> {
  const ownerRole = await prisma.role.findFirst({
    where: { tenantId, name: "Business Owner", deletedAt: null },
  });

  if (!ownerRole) return;

  // Check if this user holds the owner role
  const holdsOwnerRole = await prisma.userRole.findFirst({
    where: { membershipId, roleId: ownerRole.id },
  });

  if (!holdsOwnerRole) {
    // User is not an owner, so removing them is fine
    return;
  }

  // Count active owners in this tenant
  const activeOwnersCount = await prisma.userRole.count({
    where: {
      roleId: ownerRole.id,
      membership: {
        tenantId,
        isActive: true,
      },
    },
  });

  if (activeOwnersCount <= 1) {
    throw new Error(
      "Last Owner Protection: You cannot deactivate or revoke the Owner role from the last active Business Owner.",
    );
  }
}

/**
 * Assign a role to a user.
 */
export async function assignRole(
  raw: unknown,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await authorize("role:manage");
    const input = RoleActionSchema.parse(raw);

    // Verify role belongs to tenant
    const role = await prisma.role.findFirst({
      where: { id: input.roleId, tenantId: session.tenantId, deletedAt: null },
    });

    if (!role) {
      return { error: "Selected role does not exist in this business." };
    }

    await prisma.userRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: input.membershipId,
          roleId: input.roleId,
        },
      },
      create: {
        membershipId: input.membershipId,
        roleId: input.roleId,
      },
      update: {},
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actorUserId: session.userId,
        action: AuditAction.create,
        entityType: "UserRole",
        entityId: `${input.membershipId}-${input.roleId}`,
        after: {
          membershipId: input.membershipId,
          roleId: input.roleId,
        },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Assign role action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to assign role" };
  }
}

/**
 * Revoke a role from a user.
 */
export async function revokeRole(
  raw: unknown,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await authorize("role:manage");
    const input = RoleActionSchema.parse(raw);

    // Enforce last-owner protection
    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: { name: true },
    });

    if (role?.name === "Business Owner") {
      await assertNotLastOwner(session.tenantId, input.membershipId);
    }

    await prisma.userRole.delete({
      where: {
        membershipId_roleId: {
          membershipId: input.membershipId,
          roleId: input.roleId,
        },
      },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actorUserId: session.userId,
        action: AuditAction.delete,
        entityType: "UserRole",
        entityId: `${input.membershipId}-${input.roleId}`,
        before: {
          membershipId: input.membershipId,
          roleId: input.roleId,
        },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Revoke role action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to revoke role" };
  }
}

/**
 * Deactivate a membership.
 */
export async function deactivateMember(
  raw: unknown,
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await authorize("user:manage");
    const input = DeactivateSchema.parse(raw);

    // Verify membership belongs to this tenant
    const membership = await prisma.userTenantMembership.findFirst({
      where: { id: input.membershipId, tenantId: session.tenantId },
    });

    if (!membership) {
      return { error: "Member not found in this business." };
    }

    // Enforce last-owner protection
    await assertNotLastOwner(session.tenantId, input.membershipId);

    await prisma.userTenantMembership.update({
      where: { id: input.membershipId },
      data: { isActive: false },
    });

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actorUserId: session.userId,
        action: AuditAction.update,
        entityType: "UserTenantMembership",
        entityId: input.membershipId,
        after: {
          isActive: false,
        },
      },
    });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err: unknown) {
    console.error("Deactivate member action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to deactivate member" };
  }
}

// Lazy import Neon Auth to avoid circular dependencies
const auth = {
  async getSession() {
    const { auth: authModule } = await import("@/lib/auth/server");
    return authModule.getSession();
  },
};
