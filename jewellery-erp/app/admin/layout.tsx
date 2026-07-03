import { requireSuperAdminSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { getUserByIdQuery } from "@/lib/db/queries/user";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserRound } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSuperAdminSession();

  return runWithTenant(
    { tenantId: "", userId: session.userId, isSuperAdmin: true },
    async () => {
      const user = await getUserByIdQuery(session.userId);


      return (
        <div className="flex min-h-svh bg-muted/20">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  Control Panel
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
                  <span className="inline-block size-2 rounded-full bg-red-600 animate-pulse" />
                  Super Admin Session
                </div>
                <ThemeToggle />
                <div className="flex items-center gap-1">
                  <span className="flex size-7 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <UserRound className="size-4" />
                  </span>
                  <span className="max-w-36 truncate text-sm font-medium sm:inline">
                    {user.fullName || user.email}
                  </span>
                </div>
              </div>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      );
    }
  );
}
