"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type TenantDetails } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Building2, CheckCircle2, Plus, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<TenantDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.listBusinesses();
        setBusinesses(res.data);
      } catch (err: unknown) {
        console.error(err);
        toast.error("Failed to load business listings");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = businesses.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(term) ||
      b.slug.toLowerCase().includes(term) ||
      (b.owner?.fullName || "").toLowerCase().includes(term) ||
      (b.owner?.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground">
            Manage and provision all tenant businesses on the platform.
          </p>
        </div>
        <Link href="/admin/businesses/new" passHref>
          <Button>
            <Plus className="size-4 mr-2" />
            Register Business
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Directory</CardTitle>
          <CardDescription>
            A list of all active and deactivated businesses in the system.
          </CardDescription>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by business, slug, owner..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Loading directory...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Building2 className="size-8 text-muted-foreground/50" />
              {searchTerm ? "No matching businesses found." : "No businesses registered yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Info</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold text-foreground">{b.name}</div>
                          {b.contactEmail && (
                            <div className="text-xs text-muted-foreground">{b.contactEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.slug}</TableCell>
                      <TableCell>
                        {b.owner ? (
                          <div>
                            <div className="text-sm font-medium">{b.owner.fullName || "—"}</div>
                            <div className="text-xs text-muted-foreground">{b.owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No Owner Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        {b.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-400">
                            <CheckCircle2 className="size-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-400">
                            <XCircle className="size-3" />
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/businesses/${b.id}`} passHref>
                          <Button variant="outline" size="sm">
                            Manage
                            <ArrowRight className="size-4 ml-1" />
                          </Button>
                        </Link>
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
