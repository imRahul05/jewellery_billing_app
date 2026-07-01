"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useUiStore } from "@/lib/stores/ui-store";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const MOBILE_NAV = [
  ["/dashboard", "Dashboard"],
  ["/billing", "Billing"],
  ["/inventory", "Inventory"],
  ["/customers", "Customers"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
] as const;
export function Topbar({ userName }: { userName: string }) {
  const router = useRouter();
  const tenantName = useTenantStore((state) => state.tenantName);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  async function signOut() { await authClient.signOut(); router.push("/login"); router.refresh(); }
  return <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6"><div className="flex min-w-0 items-center gap-2"><Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggleSidebar}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu /></Button></SheetTrigger><SheetContent side="left" className="w-72"><SheetHeader><SheetTitle>Jewellery ERP</SheetTitle><SheetDescription>Business navigation</SheetDescription></SheetHeader><nav className="space-y-1 px-2">{MOBILE_NAV.map(([href, label]) => <SheetClose asChild key={href}><Link href={href} className="block rounded-md px-3 py-3 text-sm hover:bg-muted">{label}</Link></SheetClose>)}</nav></SheetContent></Sheet><Button variant="outline" className="max-w-56 justify-between"><span className="truncate">{tenantName || "Business"}</span><ChevronsUpDown className="text-muted-foreground" /></Button></div><div className="flex items-center gap-1"><ThemeToggle /><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary"><UserRound className="size-4" /></span><span className="hidden max-w-36 truncate sm:inline">{userName}</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel>{userName}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={signOut}><LogOut />Log out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header>;
}
