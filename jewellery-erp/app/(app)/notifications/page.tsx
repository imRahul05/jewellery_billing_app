"use client";

import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/query/hooks/use-notifications";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Inbox, RefreshCw, ScrollText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type FilterType = "all" | "unread" | "low_stock" | "billing";

export default function NotificationsPage() {
  const tenantId = useTenantStore((state) => state.tenantId) || "";
  const { data: notifications = [], isLoading, refetch, isFetching } = useNotifications(tenantId);
  const markReadMutation = useMarkNotificationRead(tenantId);
  const markAllReadMutation = useMarkAllNotificationsRead(tenantId);

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const unreadCount = notifications.filter((n) => n.status === "pending").length;

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return n.status === "pending";
    if (activeFilter === "low_stock") return n.category === "low_stock";
    if (activeFilter === "billing") return n.category === "billing";
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">
            Manage alerts and notifications for your jewellery business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead}>
              <Check className="size-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["all", "unread", "low_stock", "billing"] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(f)}
            className="capitalize"
          >
            {f === "unread" ? `Unread (${unreadCount})` : f.replace("_", " ")}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            A history of system events, stock alerts, and platform messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground font-mono">
              LOADING_NOTIFICATIONS_HISTORY...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              <Inbox className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold">No notifications found</p>
              <p className="text-xs text-muted-foreground/75 mt-1">
                {activeFilter === "all"
                  ? "You haven't received any notifications yet."
                  : "No notifications match the active filter criteria."}
              </p>
            </div>
          ) : (
            <div className="divide-y border rounded-md overflow-hidden bg-card">
              {filtered.map((n) => {
                const isUnread = n.status === "pending";
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-4 transition-colors relative ${
                      isUnread ? "bg-muted/30 font-medium" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <span
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          n.category === "low_stock"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {n.category === "low_stock" ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <ScrollText className="size-4" />
                        )}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-semibold leading-tight">
                          {n.title}
                        </span>
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                            onClick={() => handleMarkRead(n.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                          {n.body}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-mono pt-1">
                        <span>
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(n.createdAt).toLocaleTimeString(undefined, {
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
