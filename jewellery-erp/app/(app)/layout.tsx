import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { getEffectivePermissions } from "@/lib/rbac/permissions";
import { getTenantByIdQuery } from "@/lib/db/queries/tenant";
import { getUserByIdQuery } from "@/lib/db/queries/user";
import { AppSidebar } from "@/components/app/app-sidebar";
import { TenantHydrator } from "@/components/app/tenant-hydrator";
import { Topbar } from "@/components/app/topbar";
import { redirect } from "next/navigation";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // If a Super Admin does not belong to any tenant, redirect them directly to the Admin Portal
  if (!session.tenantId && session.isSuperAdmin) {
    redirect("/admin/businesses");
  }

  // Bind tenant context for this layout's own loads. Note: AsyncLocalStorage
  // does not reliably cross RSC segment boundaries, so nested pages/actions
  // must bind their own context via withTenant().
  return runWithTenant(

    { tenantId: session.tenantId, userId: session.userId, isSuperAdmin: session.isSuperAdmin },
    async () => {
      const [tenant, user, perms] = await Promise.all([
        getTenantByIdQuery(session.tenantId),
        getUserByIdQuery(session.userId),
        getEffectivePermissions(session.userId, session.tenantId),
      ]);
      return <div className="flex min-h-svh bg-muted/20"><TenantHydrator tenant={tenant} permissions={Array.from(perms)} isSuperAdmin={session.isSuperAdmin} /><AppSidebar /><div className="flex min-w-0 flex-1 flex-col"><Topbar userName={user.fullName || user.email} /><main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main></div></div>;

    },
  );
}
