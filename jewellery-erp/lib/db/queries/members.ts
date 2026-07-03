import "server-only";
import { prisma } from "@/lib/db";
import type { UserTenantMembership, User, UserRole, Role } from "@prisma/client";

export type TenantMemberWithDetails = UserTenantMembership & {
  user: User;
  userRoles: (UserRole & {
    role: Role;
  })[];
};

export type UserMembershipWithTenant = UserTenantMembership & {
  tenant: {
    id: string;
    name: string;
  };
};

/**
 * Retrieves the list of active team members for a given tenant,
 * including their user details and assigned roles.
 */
export async function getTenantMembersQuery(tenantId: string): Promise<TenantMemberWithDetails[]> {
  return prisma.userTenantMembership.findMany({
    where: { tenantId, isActive: true },
    include: {
      user: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Retrieves the list of active business memberships for a given user,
 * including the tenant name and ID.
 */
export async function getUserMembershipsQuery(userId: string): Promise<UserMembershipWithTenant[]> {
  return prisma.userTenantMembership.findMany({
    where: { userId, isActive: true },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
