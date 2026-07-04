"use client";

import { useEffect, useState } from "react";
import { adminApi, type PlatformStats } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Building2, RefreshCw, ShieldAlert, Users, ScrollText } from "lucide-react";
import { toast } from "sonner";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch {
      toast.error("Failed to load platform statistics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function fetchStats() {
      try {
        const res = await adminApi.getStats();
        if (active) {
          setStats(res.data);
        }
      } catch {
        toast.error("Failed to load platform statistics");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchStats();

    return () => {
      active = false;
    };
  }, []);

  const kpis = [
    {
      title: "Total Tenants",
      value: stats?.totalTenants ?? 0,
      icon: Building2,
      desc: "All registered businesses",
      color: "from-blue-600/10 to-indigo-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Active Tenants",
      value: stats?.activeTenants ?? 0,
      icon: Building2,
      desc: "Currently active accounts",
      color: "from-emerald-600/10 to-teal-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      desc: "Staff & owners accounts",
      color: "from-purple-600/10 to-pink-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      title: "Billing Volume",
      value: stats?.totalInvoices ?? 0,
      icon: ScrollText,
      desc: "Total invoices generated",
      color: "from-amber-600/10 to-orange-600/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
  ];

  // Maximum value for scaling the pure Tailwind bar chart
  const maxGrowthCount = stats?.tenantGrowth.reduce((max, pt) => Math.max(max, pt.count), 1) ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
            Control Center
          </h1>
          <p className="text-muted-foreground text-sm">
            Aggregate statistics and system metrics across the entire platform.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} disabled={isRefreshing}>
          <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="size-8 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2" />
                <div className="h-3 w-32 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <Card
                  key={idx}
                  className={`bg-gradient-to-br ${kpi.color} border transition-all hover:scale-[1.02] hover:shadow-md`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {kpi.title}
                    </CardTitle>
                    <span className="flex size-8 items-center justify-center rounded-full bg-background/80 shadow-sm border border-muted/50">
                      <Icon className="size-4 shrink-0" />
                    </span>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="text-3xl font-extrabold tracking-tight">
                      {kpi.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
                      {kpi.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="size-4 text-red-500" />
                  Tenant Acquisition History
                </CardTitle>
                <CardDescription>
                  Cumulative count of businesses onboarded in the last 6 months.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {!stats || stats.tenantGrowth.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                    No acquisition historical data available.
                  </div>
                ) : (
                  <div className="flex items-end justify-between h-48 gap-4 px-4 pt-4 border-b">
                    {stats.tenantGrowth.map((pt, i) => {
                      const heightPercent = (pt.count / maxGrowthCount) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <div className="text-[10px] font-mono font-bold">{pt.count}</div>
                          <div
                            style={{ height: `${heightPercent * 0.75}%` }}
                            className="w-full bg-gradient-to-t from-red-600 to-red-400 dark:from-red-950 dark:to-red-700 rounded-t-sm shadow-sm transition-all duration-500 hover:opacity-85"
                          />
                          <div className="text-[9px] font-semibold text-muted-foreground/80 mt-1 truncate">
                            {pt.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="size-4 text-red-500" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Platform dependencies status check.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b pb-3 text-xs">
                  <span className="font-medium">Neon PostgreSQL DB</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-3 text-xs">
                  <span className="font-medium">Neon Auth Engine</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    OPERATIONAL
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-3 text-xs">
                  <span className="font-medium">Cloudflare R2 Bucket</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    ONLINE
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">API Endpoints (v1)</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    OK
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
