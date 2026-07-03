"use client";

import * as React from "react";
import Link from "next/link";
import { 
  IndianRupee, 
  WalletCards, 
  AlertTriangle, 
  PlusCircle, 
  TrendingUp, 
  ChevronRight, 
  FileText, 
  Gem,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/db/queries/dashboard";

interface DashboardClientWrapperProps {
  data: DashboardData;
  tenantId: string;
}

const METAL_NAMES: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
};

export function DashboardClientWrapper({
  data,
}: DashboardClientWrapperProps): React.JSX.Element {
  const { kpis, metalRates, recentInvoices, salesTrend } = data;

  // Find max sales trend value for chart scaling
  const maxTrendVal = salesTrend.reduce((max, pt) => Math.max(max, Number(pt.total)), 1000);

  return (
    <div className="space-y-6 max-w-6xl p-1 md:p-2">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your business at a glance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="default" className="shadow-sm">
            <Link href="/invoices/new" className="flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="shadow-sm">
            <Link href="/customers/new" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="shadow-sm">
            <Link href="/inventory/new" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Sales</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatINR(kpis.todaysSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sales invoices issued today
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Month-to-Date Sales</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatINR(kpis.monthSales)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Accumulated MTD gross sales
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Receivables</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <WalletCards className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatINR(kpis.outstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid/partially paid sales dues
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock Products</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products with &lt; 3 items in stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sales Trend Chart Card */}
        <Card className="md:col-span-2 shadow-sm border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Sales Activity</CardTitle>
            <CardDescription>Daily gross sales volume for the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col justify-between">
            {salesTrend.length > 0 && maxTrendVal > 0 ? (
              <div className="h-full flex flex-col justify-end">
                <div className="flex h-44 items-end gap-2 md:gap-4 px-2">
                  {salesTrend.map((pt) => {
                    const value = Number(pt.total);
                    const pct = (value / maxTrendVal) * 100;
                    return (
                      <div key={pt.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-[calc(100%+5px)] scale-0 group-hover:scale-100 transition-all bg-popover text-popover-foreground text-[10px] font-mono p-2 rounded shadow-lg border z-20 pointer-events-none text-center whitespace-nowrap">
                          <p className="font-semibold">{pt.date}</p>
                          <p className="text-primary mt-0.5">{formatINR(pt.total)}</p>
                        </div>
                        
                        {/* Interactive Bar */}
                        <div 
                          className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all duration-300 shadow-sm"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        {/* Date Label */}
                        <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full font-mono">
                          {pt.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full border-t border-muted/50 mt-1 pt-2 flex justify-between text-[10px] text-muted-foreground px-2 font-mono">
                  <span>7 Days Ago</span>
                  <span>Today</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 text-muted-foreground/45 mb-2" />
                <p className="text-xs font-medium">No sales recorded this week</p>
                <p className="text-[10px]">Create sales invoices to populate this chart.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metal Rates & Checklist Panel */}
        <div className="space-y-6">
          {/* Today's Metal Rates Widget */}
          <Card className="shadow-sm border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                  <Gem className="h-4 w-4 text-primary" />
                  Metal Rates
                </CardTitle>
                <Button asChild variant="ghost" size="xs" className="h-7 text-xs font-semibold px-2 text-primary hover:text-primary">
                  <Link href="/settings/business">Edit Rates</Link>
                </Button>
              </div>
              <CardDescription>Latest rate per gram configured for pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {metalRates.length > 0 ? (
                metalRates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between border-b pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-foreground">
                        {METAL_NAMES[rate.metalType.toLowerCase()] || rate.metalType}
                      </span>
                      {rate.purityFineness && (
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Purity: {Number(rate.purityFineness) * 1000} Fine
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {formatINR(rate.ratePerGram)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">No metal rates configured yet.</p>
                  <Button asChild variant="outline" size="xs" className="mt-3">
                    <Link href="/settings/business">Set Metal Rates</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Dashboard Action Cards */}
          <Card className="shadow-sm border bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Onboarding Checklist</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                <span>Create Categories &amp; Products</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary">2</div>
                <span>Record Supplier Procurement / Stock</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-full border border-primary/50 flex items-center justify-center text-[10px] font-bold text-primary">3</div>
                <span>Create Customers &amp; Invoices</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity / Invoices Table */}
      <Card className="shadow-sm border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <CardDescription>Latest invoice documents issued this month</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/invoices" className="flex items-center gap-1">
              View All
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentInvoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium text-foreground">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline hover:text-primary">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {inv.customerName || <span className="text-muted-foreground/60">Walk-in Client</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                          inv.type === "sales"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-400"
                        )}
                      >
                        {inv.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono",
                          inv.status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                          inv.status === "partially_paid" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                          inv.status === "draft" && "bg-slate-500/10 text-slate-700 dark:text-slate-400",
                          (inv.status === "cancelled" || inv.status === "void") && "bg-destructive/10 text-destructive"
                        )}
                      >
                        {inv.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatINR(inv.grandTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 text-muted-foreground/35 mb-2" />
              <p className="font-medium">No invoices registered in this date range</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/invoices/new">Issue First Invoice</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
