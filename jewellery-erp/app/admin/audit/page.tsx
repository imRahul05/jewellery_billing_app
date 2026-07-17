"use client";

import { useEffect, useState } from "react";
import { adminApi, type PlatformAuditLog } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

export default function PlatformAuditPage() {
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<PlatformAuditLog | null>(null);
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const loadLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminApi.getPlatformAuditLogs({ page, limit, search: debouncedSearch });
      setLogs(res.data);
      setTotalCount(res.meta?.count ?? 0);
    } catch {
      toast.error("Failed to load platform audit logs");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function fetchLogs() {
      try {
        const res = await adminApi.getPlatformAuditLogs({ page, limit, search: debouncedSearch });
        if (active) {
          setLogs(res.data);
          setTotalCount(res.meta?.count ?? 0);
        }
      } catch {
        toast.error("Failed to load platform audit logs");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchLogs();

    return () => {
      active = false;
    };
  }, [page, debouncedSearch]);

  const filtered = logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
            System Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm">
            Auditable stream of all creations, updates, and impersonations across all business tenants.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={isRefreshing}>
          <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Activity Feed</CardTitle>
          <CardDescription>
            Immutable audit trail from all workspaces in the platform. Click a row to inspect JSON details.
          </CardDescription>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search action, business, actor..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground font-mono">
              SCANNING_SYSTEM_AUDIT_LOGS...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed rounded-lg">
              <p className="font-semibold text-muted-foreground">No events found.</p>
              <p className="text-xs text-muted-foreground/75">
                {searchTerm ? "No results match your search." : "No audit trail has been captured yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Business Tenant</TableHead>
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
                        <TableCell className="font-semibold text-xs text-red-600 dark:text-red-400">
                          {l.tenantName}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          <div className="font-semibold text-xs leading-none">
                            {l.actor?.fullName || "System"}
                          </div>
                          <div className="text-[9px] text-muted-foreground mt-0.5 leading-none">
                            {l.actor?.email || "system@platform.com"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold capitalize ${
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
                            <span className="text-muted-foreground ml-1 font-mono text-[9px]">
                              ({l.entityId.slice(0, 8)}...)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {l.ipAddress || "Internal"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                <div className="text-xs text-muted-foreground font-mono">
                  Showing Page {page} ({(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} events)
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= totalCount || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl text-red-600 dark:text-red-400">System Log Detail</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              Log ID: {selectedLog?.id}
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs border border-red-500/20 rounded-lg p-4 bg-muted/20">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Timestamp</span>
                  <span className="font-semibold">{new Date(selectedLog.occurredAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Business</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{selectedLog.tenantName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5 font-semibold">Actor</span>
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
