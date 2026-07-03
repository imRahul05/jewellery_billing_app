"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  CreditCard, 
  FileText, 
  Gem, 
  Printer, 
  Percent, 
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR, formatWeight, formatINRWords } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaymentBreakdown {
  method: string;
  count: number;
  total: string;
}

interface SalesPurchaseSummary {
  salesCount: number;
  salesTotal: string;
  purchaseCount: number;
  purchaseTotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
}

interface InventoryStats {
  inStockCount: number;
  inStockGrossWeight: string;
  inStockNetWeight: string;
  inStockCostPrice: string;
}

interface ReportData {
  summary: SalesPurchaseSummary;
  payments: PaymentBreakdown[];
  inventory: InventoryStats;
  recentInvoices: {
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    grandTotal: string;
    invoiceDate: string;
    customerName: string | null;
  }[];
}

interface ReportsClientWrapperProps {
  range: string;
  reportData: ReportData;
  startDateStr: string;
  endDateStr: string;
}

const RANGES = [
  { id: "this_month", label: "This Month" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "all", label: "All Time" },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card/POS",
  upi: "UPI / QR",
  bank_transfer: "Bank Net Transfer",
  cheque: "Cheque",
  store_credit: "Store Credit",
  gold_exchange: "Gold Exchange",
};

export function ReportsClientWrapper({
  range,
  reportData,
  startDateStr,
  endDateStr,
}: ReportsClientWrapperProps): React.JSX.Element {
  const router = useRouter();
  const handleRangeChange = (newRange: string) => {
    router.push(`/reports?range=${newRange}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate tax sum
  const taxSum = Number(reportData.summary.cgstTotal) + 
                 Number(reportData.summary.sgstTotal) + 
                 Number(reportData.summary.igstTotal);

  // Calculate total payments received
  const totalReceipts = reportData.payments.reduce((acc, curr) => acc + Number(curr.total), 0);

  // Process Sales trends over recent invoices
  const chartInvoices = [...reportData.recentInvoices]
    .filter(inv => inv.type === "sales" && inv.status !== "cancelled")
    .reverse();

  const maxTotal = chartInvoices.reduce((max, inv) => Math.max(max, Number(inv.grandTotal)), 10000);

  return (
    <div className="space-y-6 max-w-6xl p-1 md:p-2">
      {/* Dynamic print-override styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div id="print-area" className="space-y-6">
        {/* Header Block */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Business Intelligence & Reports
            </h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground/75" />
              Reporting period: <span className="font-semibold text-foreground">{startDateStr}</span> to{" "}
              <span className="font-semibold text-foreground">{endDateStr}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <div className="inline-flex rounded-lg border bg-background p-1 shadow-sm">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRangeChange(r.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                    range === r.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <Button variant="outline" size="icon" onClick={handlePrint} title="Print Report">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Sales</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {formatINR(reportData.summary.salesTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted-foreground/60" />
                <span>{reportData.summary.salesCount} Sales Invoices issued</span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventory Procurement</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {formatINR(reportData.summary.purchaseTotal)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3 text-muted-foreground/60" />
                <span>{reportData.summary.purchaseCount} Purchase Invoices</span>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tax Collected</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Percent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {formatINR(taxSum)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5 flex justify-between font-mono">
                <span>C: {formatINR(reportData.summary.cgstTotal)}</span>
                <span>S: {formatINR(reportData.summary.sgstTotal)}</span>
                <span>I: {formatINR(reportData.summary.igstTotal)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In-Stock Valuation</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Gem className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {formatINRWords(reportData.inventory.inStockCostPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span>{reportData.inventory.inStockCount} items ({formatWeight(reportData.inventory.inStockNetWeight)} net)</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Graphs Block */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Sales Performance Chart (SVG) */}
          <Card className="col-span-2 shadow-sm border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Sales Invoice Trend</CardTitle>
              <CardDescription>Value of the latest sales transactions within the current range</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex flex-col justify-between">
              {chartInvoices.length > 0 ? (
                <div className="h-full flex flex-col justify-end">
                  <div className="flex h-44 items-end gap-2 md:gap-4 px-2">
                    {chartInvoices.map((inv) => {
                      const value = Number(inv.grandTotal);
                      const pct = (value / maxTotal) * 100;
                      return (
                        <div key={inv.id} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          {/* CSS Tooltip */}
                          <div className="absolute bottom-[calc(100%+5px)] scale-0 group-hover:scale-100 transition-all bg-popover text-popover-foreground text-[10px] font-mono p-2 rounded shadow-lg border z-20 pointer-events-none text-center whitespace-nowrap">
                            <p className="font-semibold">{inv.invoiceNumber}</p>
                            <p className="text-primary mt-0.5">{formatINR(inv.grandTotal)}</p>
                          </div>
                          
                          {/* Bar */}
                          <div 
                            className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all duration-300 shadow-sm"
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                          {/* Date Label */}
                          <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full font-mono">
                            {new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-full border-t border-muted/50 mt-1 pt-2 flex justify-between text-[10px] text-muted-foreground px-2 font-mono">
                    <span>Oldest Sales</span>
                    <span>Newest Sales</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-medium">No sales data found for chart</p>
                  <p className="text-xs">Invoices must be issued as &quot;Sales&quot; type to graph.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Share */}
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
              <CardDescription>Breakdown of receipts total ({formatINR(totalReceipts)})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData.payments.length > 0 ? (
                reportData.payments.map((p) => {
                  const pct = totalReceipts > 0 ? (Number(p.total) / totalReceipts) * 100 : 0;
                  return (
                    <div key={p.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {METHOD_LABELS[p.method] || p.method}
                        </span>
                        <span className="text-muted-foreground font-mono">
                          {formatINR(p.total)} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground">
                  <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">No receipts completed</p>
                  <p className="text-xs">Record payments against invoices to generate.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Transactions List */}
        <Card className="shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Reporting Log</CardTitle>
              <CardDescription>Latest 10 invoices issued or finalized in this range</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reportData.recentInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client / Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium text-foreground">
                        {inv.invoiceNumber}
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
                <p className="text-xs">Adjust your date range filters to view older logs.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
