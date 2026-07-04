"use client";

import { useEffect, useState } from "react";
import { businessApi, type AppAuditLog } from "@/lib/api/business.api";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const tenantId = useTenantStore((state) => state.tenantId) || "";
  const permissions = useTenantStore((state) => state.permissions) || [];
  
  const [logs, setLogs] = useState<AppAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AppAuditLog | null>(null);

  const canReadAudit = permissions.includes("audit:read") || permissions.includes("*");

  const loadLogs = async () => {
    if (!canReadAudit) return;
    setIsRefreshing(true);
    try {
      const res = await businessApi.getAuditLogs();
      setLogs(res.data);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    async function fetchLogs() {
      if (!canReadAudit) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await businessApi.getAuditLogs();
        if (active) {
          setLogs(res.data);
        }
      } catch {
        toast.error("Failed to load audit logs");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchLogs();

    return () => {
      active = false;
    };
  }, [tenantId, canReadAudit]);

  if (!canReadAudit) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2 text-center max-w-md mx-auto">
        <ShieldAlert className="size-12 text-destructive" />
        <h2 className="text-xl font-bold tracking-tight">Access Denied</h2>
        <p className="text-muted-foreground text-sm">
          You do not have the required permissions (`audit:read`) to view the audit trails for this business.
        </p>
      </div>
    );
  }

  const filtered = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.entityType.toLowerCase().includes(term) ||
      (l.entityId || "").toLowerCase().includes(term) ||
      (l.actor?.email || "").toLowerCase().includes(term) ||
      (l.actor?.fullName || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View the immutable trails of updates, creations, and exports for this business.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={isRefreshing}
        >
          <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trail Directory</CardTitle>
          <CardDescription>
            System modifications sorted by occurred timestamp. Click a row to view raw data.
          </CardDescription>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search action, actor, type..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" aria-label="Filters">
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground font-mono">
              LOADING_AUDIT_TRAILS...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed rounded-lg">
              <p className="font-semibold text-muted-foreground">No events found.</p>
              <p className="text-xs text-muted-foreground/75">
                {searchTerm ? "No results match your search." : "No audit trail has been logged yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow
                      key={l.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedLog(l)}
                    >
                      <TableCell className="text-xs font-mono">
                        {new Date(l.occurredAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <div className="font-semibold text-xs leading-none">
                          {l.actor?.fullName || "System"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                          {l.actor?.email || "system@jewelleryerp.com"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            l.action === "create"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : l.action === "delete" || l.action === "soft_delete"
                              ? "bg-destructive/10 text-destructive border border-destructive/20"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          {l.action.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold">{l.entityType}</span>
                        {l.entityId && (
                          <span className="text-muted-foreground ml-1 font-mono text-[10px]">
                            ({l.entityId.slice(0, 8)}...)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {l.ipAddress || "Local"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Audit Log Detail</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              Log ID: {selectedLog?.id}
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs border rounded-lg p-4 bg-muted/20">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Timestamp</span>
                  <span className="font-semibold">{new Date(selectedLog.occurredAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">IP Address</span>
                  <span className="font-mono">{selectedLog.ipAddress || "Internal System"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Actor</span>
                  <span className="font-semibold">{selectedLog.actor?.fullName || "System"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Target Entity</span>
                  <span className="font-semibold">
                    {selectedLog.entityType} ({selectedLog.entityId || "N/A"})
                  </span>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div className="text-xs">
                  <span className="text-muted-foreground block mb-1">User Agent</span>
                  <div className="border rounded-md p-2 bg-muted/40 font-mono text-[10px] break-all leading-normal">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {selectedLog.before && (
                <div className="text-xs">
                  <span className="text-muted-foreground block mb-1">State Before Change</span>
                  <pre className="border rounded-md p-2.5 bg-card overflow-x-auto font-mono text-[10px] max-h-48 leading-relaxed">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div className="text-xs">
                  <span className="text-muted-foreground block mb-1">State After Change</span>
                  <pre className="border rounded-md p-2.5 bg-card overflow-x-auto font-mono text-[10px] max-h-48 leading-relaxed">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
