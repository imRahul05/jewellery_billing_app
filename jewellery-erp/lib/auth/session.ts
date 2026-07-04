import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db";

export interface Session {
  userId: string;
  tenantId: string;
  membershipId: string;
  isSuperAdmin: boolean;
}

/**
 * Resolve the authenticated user + active tenant, or redirect.
 *
 * Neon Auth (Better Auth) owns identity; our `users` table is the app
 * projection keyed by `authUserId`. Tenant is resolved from an ACTIVE
 * `UserTenantMembership` — never from client input (doc 04 §5.3 rule).
 *
 * Multi-tenant selection uses a cookie (`current_tenant_id`) if the user has
 * multiple active memberships.
 *
 * Returns `{ userId, tenantId, membershipId, isSuperAdmin }`
 */
export async function requireSession(): Promise<Session> {
  // Neon Auth reads request cookies internally. Establish the runtime boundary
  // explicitly so Cache Components does not probe the session during prerendering.
  await connection();
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const authUserId = session.user.id;

  // Map auth subject → app user projection.
  const user = await prisma.user.findUnique({
    where: { authUserId },
    select: { id: true, isSuperAdmin: true },
  });
  if (!user) redirect("/select-tenant");

  const memberships = await prisma.userTenantMembership.findMany({
    where: {
      userId: user.id,
      isActive: true,
      tenant: {
        isActive: true,
        deletedAt: null,
      },
    },
    select: { id: true, tenantId: true },
    orderBy: { createdAt: "asc" },
  });

  // For regular users, we require at least one active membership.
  // For Super Admins, we do NOT force them to have a tenant membership.
  if (memberships.length === 0 && !user.isSuperAdmin) {
    redirect("/select-tenant");
  }

  let membership = memberships[0] || null;

  const cookieStore = await cookies();

  if (memberships.length > 1) {
    const selectedTenantId = cookieStore.get("current_tenant_id")?.value;
    const found = memberships.find((m) => m.tenantId === selectedTenantId);
    if (found) {
      membership = found;
    } else {
      redirect("/select-tenant");
    }
  }

  let tenantId = membership?.tenantId ?? "";
  let membershipId = membership?.id ?? "";

  // Super Admin impersonation override
  if (user.isSuperAdmin) {
    const actingTenantId = cookieStore.get("acting_tenant_id")?.value;
    if (actingTenantId) {
      const tenantExists = await prisma.tenant.findFirst({
        where: { id: actingTenantId, deletedAt: null },
      });
      if (tenantExists) {
        tenantId = actingTenantId;
        membershipId = "super-admin-impersonation-membership";
      }
    }
  }

  return {
    userId: user.id,
    tenantId,
    membershipId,
    isSuperAdmin: user.isSuperAdmin,
  };
}


/**
 * Require a session and verify the authenticated user is a Super Admin.
 * Redirects non-super-admins to /dashboard.
 */
export async function requireSuperAdminSession(): Promise<Session> {
  const session = await requireSession();
  if (!session.isSuperAdmin) {
    redirect("/dashboard");
  }
  return session;
}
