"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { invoiceApi } from "@/lib/api/invoices.api";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { Can } from "@/components/rbac/can";
import { FileText, Plus, Search, RotateCcw, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function InvoicesListPage(): React.JSX.Element {
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    let active = true;
    const fetchInvoices = async (): Promise<void> => {
      try {
        setLoading(true);
        const params = {
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          limit: 50,
        };
        const res = await invoiceApi.getInvoices(params);
        if (active) {
          setInvoices(res.data);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to load invoices";
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchInvoices();
    return () => {
      active = false;
    };
  }, [statusFilter, typeFilter]);

  const handleDownloadPdf = async (id: string): Promise<void> => {
    try {
      toast.info("Generating PDF download link...");
      const res = await invoiceApi.getInvoicePdfUrl(id);
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        // Direct buffer streaming fallback
        window.open(`/api/v1/invoices/${id}/pdf?stream=true`, "_blank");
      }
    } catch {
      // Direct stream fallback
      window.open(`/api/v1/invoices/${id}/pdf?stream=true`, "_blank");
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "issued":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "partially_paid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!search) return true;
    return inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Billing & Invoices
          </h1>
          <p className="text-muted-foreground">
            Generate and manage GST Tax Invoices, Cash Memos, and customer returns.
          </p>
        </div>
        <Can permission="invoice:create">
          <Link href="/invoices/new" passHref>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-indigo-100">
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </Can>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Invoice Number..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="draft">Draft / Estimate</option>
                <option value="issued">Issued / Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="sales">Sales Invoice</option>
                <option value="purchase">Purchase Voucher</option>
                <option value="return">Sales Return</option>
                <option value="quotation">Quotation</option>
                <option value="estimate">Estimate</option>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice list table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Invoice Register</CardTitle>
          <CardDescription>Review all billing transactions and invoice lifecycle states.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <span className="text-muted-foreground animate-pulse font-medium">Loading invoices...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted/20 rounded-lg p-6">
              <FileText className="h-10 w-10 text-muted-foreground/45 mb-2" />
              <p className="text-muted-foreground font-medium">No invoices match your filter criteria.</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto rounded-lg border border-muted/25">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-semibold text-blue-600 dark:text-blue-400">
                        <Link href={`/invoices/${inv.id}`}>{inv.invoiceNumber}</Link>
                      </TableCell>
                      <TableCell>{inv.invoiceDate}</TableCell>
                      <TableCell className="capitalize font-medium">{inv.type}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(inv.status)}`}>
                          {inv.status.replace("_", " ").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{parseFloat(inv.grandTotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">₹{parseFloat(inv.balanceDue).toFixed(2)}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Download PDF" onClick={() => void handleDownloadPdf(inv.id)}>
                          <FileText className="h-4 w-4 text-slate-500" />
                        </Button>
                        {inv.status !== "draft" && inv.status !== "cancelled" && parseFloat(inv.balanceDue) > 0 && (
                          <Link href={`/invoices/${inv.id}/payment`} passHref>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Record Payment">
                              <CreditCard className="h-4 w-4 text-emerald-500" />
                            </Button>
                          </Link>
                        )}
                        {inv.status !== "draft" && inv.status !== "cancelled" && (
                          <Link href={`/invoices/${inv.id}?return=true`} passHref>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Process Return">
                              <RotateCcw className="h-4 w-4 text-amber-500" />
                            </Button>
                          </Link>
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
