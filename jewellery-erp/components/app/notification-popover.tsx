"use client";

import Link from "next/link";
import { Bell, Check, Inbox } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/query/hooks/use-notifications";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function NotificationPopover() {
  const tenantId = useTenantStore((state) => state.tenantId) || "";
  const { data: notifications = [], isLoading } = useNotifications(tenantId);
  const markReadMutation = useMarkNotificationRead(tenantId);
  const markAllReadMutation = useMarkAllNotificationsRead(tenantId);

  const unreadCount = notifications.filter((n) => n.status === "pending").length;

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync(id);
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full" aria-label="Open notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 bg-card/95 backdrop-blur-md border">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="font-semibold text-sm">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary font-medium hover:underline" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground font-mono">
              LOADING_NOTIFICATIONS...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Inbox className="size-8 text-muted-foreground/45 mb-2" />
              <p className="text-xs font-medium">You&apos;re all caught up!</p>
              <p className="text-[10px] text-muted-foreground/75 mt-0.5">No new notifications.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  className={`flex flex-col gap-1 p-3 transition-colors text-left relative ${
                    n.status === "pending" ? "bg-muted/40 font-medium" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {n.title}
                    </span>
                    {n.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-5 shrink-0 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                        onClick={(e) => handleMarkRead(n.id, e)}
                        aria-label="Mark read"
                      >
                        <Check className="size-3" />
                      </Button>
                    )}
                  </div>
                  {n.body && (
                    <p className="text-[11px] text-muted-foreground font-normal leading-normal pr-5">
                      {n.body}
                    </p>
                  )}
                  <span className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <Link href="/notifications" passHref className="w-full">
          <Button variant="ghost" className="w-full text-center text-xs font-semibold h-10 rounded-t-none">
            View all notifications
          </Button>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
