import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export interface Session {
  userId: string;
  tenantId: string;
  membershipId: string;
}

/**
 * Resolve the authenticated user + active tenant, or redirect.
 *
 * Neon Auth (Better Auth) owns identity; our `users` table is the app
 * projection keyed by `authUserId`. Tenant is resolved from an ACTIVE
 * `UserTenantMembership` — never from client input (doc 04 §5.3 rule).
 *
 * NOTE: the current Neon Auth beta does not expose custom session metadata,
 * so "active tenant" is derived from memberships: a single active membership
 * is auto-selected; multiple memberships require `/select-tenant` (later phase).
 *
 * Returns `{ userId, tenantId, membershipId }` — userId is our internal
 * `users.id`, not the auth subject.
 */
export async function requireSession(): Promise<Session> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const authUserId = session.user.id;

  // Map auth subject → app user projection.
  const user = await prisma.user.findUnique({
    where: { authUserId },
    select: { id: true },
  });
  if (!user) redirect("/select-tenant");

  const memberships = await prisma.userTenantMembership.findMany({
    where: { userId: user.id, isActive: true },
    select: { id: true, tenantId: true },
    orderBy: { createdAt: "asc" },
  });

  // No active membership yet, or must pick among several → tenant selector.
  if (memberships.length !== 1) redirect("/select-tenant");

  const membership = memberships[0];
  return {
    userId: user.id,
    tenantId: membership.tenantId,
    membershipId: membership.id,
  };
}
