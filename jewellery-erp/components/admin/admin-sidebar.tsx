"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Gem, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/businesses", label: "All Businesses", icon: Building2 },
  { href: "/admin/businesses/new", label: "Register Business", icon: Plus },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 border-r bg-sidebar text-sidebar-foreground lg:flex lg:w-60 lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white">
          <Gem className="size-4" />
        </span>
        <span className="truncate font-semibold">Platform Admin</span>
      </div>
      <nav className="flex-1 space-y-1 p-2" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const exactActive = href === "/admin/businesses" ? pathname === "/admin/businesses" : pathname.startsWith(href);


          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                exactActive
                  ? "bg-red-50 text-red-600 font-medium dark:bg-red-950/30 dark:text-red-400"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Link
          href="/dashboard"
          className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="size-4 shrink-0 rotate-180" />
          <span>Exit Admin Portal</span>
        </Link>
      </div>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        Control Center · v1.0
      </p>
    </aside>
  );
}
