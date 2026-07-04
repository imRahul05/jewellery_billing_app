"use client";

import { useState } from "react";
import { adminApi, type PlatformUser } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserRound, Users, Shield } from "lucide-react";
import { toast } from "sonner";

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setIsLoading(true);
    try {
      const res = await adminApi.searchUsers(search);
      setUsers(res.data);
    } catch {
      toast.error("Failed to search platform users");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
          Platform Users
        </h1>
        <p className="text-muted-foreground text-sm">
          Search and audit user accounts across all tenant organizations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory Search</CardTitle>
          <CardDescription>
            Search by full name or email address across all database projections.
          </CardDescription>
          <form onSubmit={handleSearch} className="flex items-center gap-2 mt-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="owner@store.com or John Doe..."
                className="pl-8 h-10 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-10">
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground font-mono">
              SEARCHING_USER_PROJECTIONS...
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed rounded-lg">
              <Users className="size-8 text-muted-foreground/50" />
              <p className="font-semibold text-muted-foreground">No users matching search.</p>
              <p className="text-xs text-muted-foreground/75">Submit a query above to scan the platform directory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Information</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Business Memberships</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-400 shrink-0">
                            <UserRound className="size-3.5" />
                          </span>
                          <div>
                            <div className="font-semibold text-xs leading-none">
                              {u.fullName || "Un-named User"}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold">
                            <Shield className="size-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border">
                            Standard User
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                      <TableCell>
                        {u.memberships.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic">
                            No active business memberships
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {u.memberships.map((m) => (
                              <span
                                key={m.id}
                                className="inline-flex flex-col rounded border bg-muted/40 p-1 text-[9px] leading-tight"
                              >
                                <span className="font-semibold text-foreground">{m.tenantName}</span>
                                <span className="text-muted-foreground mt-0.5 text-[8px]">
                                  {m.roles.join(", ")}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
