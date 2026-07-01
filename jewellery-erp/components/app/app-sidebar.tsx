"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, FileText, Gem, LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/stores/ui-store";
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "Billing", icon: FileText },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
export function AppSidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  return <aside className={cn("hidden shrink-0 border-r bg-sidebar text-sidebar-foreground transition-[width] lg:flex lg:flex-col", collapsed ? "w-16" : "w-60")}>
    <div className="flex h-16 items-center gap-3 border-b px-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Gem className="size-4" /></span>{!collapsed && <span className="truncate font-semibold">Jewellery ERP</span>}</div>
    <nav className="flex-1 space-y-1 p-2" aria-label="Primary navigation">{NAV_ITEMS.map(({ href, label, icon: Icon }) => { const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} title={collapsed ? label : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors", active ? "bg-primary/12 font-medium text-primary" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", collapsed && "justify-center px-0")}><Icon className="size-4 shrink-0" />{!collapsed && <span>{label}</span>}</Link>; })}</nav>
    {!collapsed && <p className="border-t px-4 py-3 text-xs text-muted-foreground">Foundation build · Phase 1</p>}
  </aside>;
}
