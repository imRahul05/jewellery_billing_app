"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { invoiceApi, ReturnInvoiceInput } from "@/lib/api/invoices.api";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";
import { FileText, ArrowLeft, CreditCard, Ban, Undo2, CheckCircle } from "lucide-react";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Return mode state
  const isReturnMode = searchParams.get("return") === "true";
  const [returnReason, setReturnReason] = useState<string>("");
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  // Cancel dialog state
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const loadInvoice = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await invoiceApi.getInvoiceById(id);
        if (active) {
          setInvoice(res.data);
          // Initialize return quantities
          const qties: Record<string, number> = {};
          res.data.lineItems?.forEach(line => {
            qties[line.id] = line.quantity;
          });
          setReturnQuantities(qties);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to load invoice";
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadInvoice();
    return () => {
      active = false;
    };
  }, [id, refreshKey]);

  const fetchInvoice = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFinalize = async (): Promise<void> => {
    try {
      setActionLoading(true);
      await invoiceApi.finalizeInvoice(id);
      toast.success("Invoice finalized and sequence number assigned!");
      fetchInvoice();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to finalize invoice";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!cancelReason) {
      toast.error("Please provide a reason for cancellation.");
      return;
    }
    try {
      setActionLoading(true);
      await invoiceApi.cancelInvoice(id, cancelReason);
      toast.success("Invoice cancelled successfully!");
      setIsCancelOpen(false);
      fetchInvoice();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel invoice";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    try {
      toast.info("Generating PDF download link...");
      const res = await invoiceApi.getInvoicePdfUrl(id);
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        window.open(`/api/v1/invoices/${id}/pdf?stream=true`, "_blank");
      }
    } catch {
      window.open(`/api/v1/invoices/${id}/pdf?stream=true`, "_blank");
    }
  };

  const handleSubmitReturn = async (): Promise<void> => {
    if (!returnReason) {
      toast.error("Please provide a return reason.");
      return;
    }

    const payloadLines = Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([lineItemId, quantity]) => ({
        lineItemId,
        quantity,
      }));

    if (payloadLines.length === 0) {
      toast.error("Please return at least one item.");
      return;
    }

    try {
      setActionLoading(true);
      const payload: ReturnInvoiceInput = {
        reason: returnReason,
        lines: payloadLines,
      };

      const res = await invoiceApi.createReturn(id, payload);
      toast.success(`Credit Note ${res.data.invoiceNumber} generated!`);
      router.push(`/invoices/${res.data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process return";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="text-muted-foreground animate-pulse font-medium">Loading details...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6 max-w-lg text-center space-y-4">
        <h2 className="text-2xl font-bold">Invoice Not Found</h2>
        <p className="text-muted-foreground">The requested invoice details could not be retrieved.</p>
        <Link href="/invoices" passHref>
          <Button>Back to Invoices</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <Link href="/invoices" passHref>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm">Status: <span className="uppercase font-semibold text-slate-800">{invoice.status}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPdf}>
            <FileText className="mr-2 h-4 w-4" /> Download PDF
          </Button>

          {invoice.status === "draft" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={handleFinalize} disabled={actionLoading}>
              <CheckCircle className="mr-2 h-4 w-4" /> Finalize & Issue
            </Button>
          )}

          {invoice.status !== "draft" && invoice.status !== "cancelled" && parseFloat(invoice.balanceDue) > 0 && (
            <Link href={`/invoices/${id}/payment`} passHref>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <CreditCard className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </Link>
          )}

          {invoice.status !== "draft" && invoice.status !== "cancelled" && (
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Ban className="mr-2 h-4 w-4" /> Cancel Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Invoice</DialogTitle>
                  <DialogDescription>Provide a cancellation reason. Reverts inventory items to stock.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Label htmlFor="cancel-reason">Reason</Label>
                  <Input
                    id="cancel-reason"
                    placeholder="e.g. Typo in billing details, customer revoked"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Close</Button>
                  <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>Confirm Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Return Flow Interface */}
      {isReturnMode && (
        <Card className="border-amber-200 bg-amber-50/15 shadow-md">
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center">
              <Undo2 className="mr-2 h-5 w-5" /> Sales Return Wizard
            </CardTitle>
            <CardDescription>Select quantities of line items to return. Restores items to stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line Item</TableHead>
                    <TableHead className="text-right">Issued Qty</TableHead>
                    <TableHead className="text-right">Return Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.description}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={line.quantity}
                          className="w-20 ml-auto text-right"
                          value={returnQuantities[line.id] || 0}
                          onChange={(e) => setReturnQuantities({
                            ...returnQuantities,
                            [line.id]: Math.min(line.quantity, Math.max(0, parseInt(e.target.value, 10) || 0)),
                          })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ret-reason">Reason for Return</Label>
              <Input
                id="ret-reason"
                placeholder="e.g. Metal purity dispute, wrong item selected"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href={`/invoices/${id}`} passHref>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium" onClick={handleSubmitReturn} disabled={actionLoading}>
                Issue Credit Note (CN)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Jewellery Items list</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Gross Wt</TableHead>
                      <TableHead className="text-right">Net Wt</TableHead>
                      <TableHead className="text-right">Rate / Gram</TableHead>
                      <TableHead className="text-right">Taxable Val</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.description}</TableCell>
                        <TableCell className="text-right">{parseFloat(line.grossWeight).toFixed(3)}g</TableCell>
                        <TableCell className="text-right">{parseFloat(line.netWeight).toFixed(3)}g</TableCell>
                        <TableCell className="text-right">₹{parseFloat(line.ratePerGram).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-800">₹{parseFloat(line.taxableValue).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger & Totals */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold">₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.cgstTotal) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>CGST (1.5%):</span>
                    <span className="font-semibold">₹{parseFloat(invoice.cgstTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (1.5%):</span>
                    <span className="font-semibold">₹{parseFloat(invoice.sgstTotal).toFixed(2)}</span>
                  </div>
                </>
              )}
              {parseFloat(invoice.igstTotal) > 0 && (
                <div className="flex justify-between">
                  <span>IGST (3.0%):</span>
                  <span className="font-semibold">₹{parseFloat(invoice.igstTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Round Off:</span>
                <span className="font-semibold">₹{parseFloat(invoice.roundOff).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span>₹{parseFloat(invoice.grandTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-semibold text-emerald-600">
                <span>Amount Paid:</span>
                <span>₹{parseFloat(invoice.amountPaid).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-rose-600">
                <span>Balance Due:</span>
                <span>₹{parseFloat(invoice.balanceDue).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
