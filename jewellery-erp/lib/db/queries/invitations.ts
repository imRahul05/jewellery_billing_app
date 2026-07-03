import "server-only";
import { prisma } from "@/lib/db";
import type { Invitation, Role, Tenant } from "@prisma/client";

export type InvitationWithRole = Invitation & {
  role: Role;
};

export type InvitationWithDetails = Invitation & {
  tenant: Tenant;
  role: Role;
};

/**
 * Retrieves the pending invitations for a given tenant, including roles.
 */
export async function getPendingInvitationsQuery(tenantId: string): Promise<InvitationWithRole[]> {
  return prisma.invitation.findMany({
    where: { tenantId, status: "pending" },
    include: {
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Resolves invitation details by a unique invite token.
 * Only retrieves pending invitations.
 */
export async function getPendingInvitationByTokenQuery(token: string): Promise<InvitationWithDetails | null> {
  return prisma.invitation.findFirst({
    where: { token, status: "pending" },
    include: {
      tenant: true,
      role: true,
    },
  });
}
