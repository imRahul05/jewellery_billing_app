"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, LayoutGrid } from "lucide-react";
import { toIndianWords } from "@/lib/billing/indian-words";
import { Prisma } from "@prisma/client";

export interface PreviewInvoiceLine {
  id?: string;
  description: string;
  karat?: number | null;
  purityFineness?: string | number | null;
  grossWeight: string | number;
  netWeight: string | number;
  ratePerGram: string | number;
  makingCharge: string | number;
  stoneCharge: string | number;
  discount: string | number;
  taxableValue: string | number;
  cgstAmount: string | number;
  sgstAmount: string | number;
  igstAmount: string | number;
  lineTotal: string | number;
}

export interface PreviewInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  type: string;
  status: string;
  placeOfSupply?: string | null;
  subtotal: string | number;
  makingChargesTotal: string | number;
  discountTotal: string | number;
  cgstTotal: string | number;
  sgstTotal: string | number;
  igstTotal: string | number;
  roundOff: string | number;
  grandTotal: string | number;
  amountPaid: string | number;
  balanceDue: string | number;
  notes?: string | null;
  lineItems?: PreviewInvoiceLine[];
  payments?: Array<{
    id?: string;
    method: string;
    amount: string | number;
    exchangeMetalWeight?: string | number | null;
    exchangeMetalValue?: string | number | null;
  }>;
}

export interface PreviewCustomer {
  name: string;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  addressJson?: Prisma.JsonValue;
}

interface InvoicePreviewDialogProps {
  invoice: PreviewInvoice;
  customer?: PreviewCustomer | null;
  tenantName: string;
  tenantGstin?: string | null;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  defaultTemplate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCustomerAddress(addr: Prisma.JsonValue | undefined | null): string {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object" && addr !== null) {
    const record = addr as { street?: string; city?: string; state?: string; postalCode?: string };
    const parts = [record.street, record.city, record.state, record.postalCode];
    return parts.filter(Boolean).join(", ") || "N/A";
  }
  return "N/A";
}

export function InvoicePreviewDialog({
  invoice,
  customer,
  tenantName,
  tenantGstin,
  tenantAddress,
  tenantPhone,
  defaultTemplate,
  open,
  onOpenChange,
}: InvoicePreviewDialogProps): React.JSX.Element {
  const [activeTemplate, setActiveTemplate] = useState<string>(
    defaultTemplate ? defaultTemplate.split("_").pop() || "classic" : "classic"
  );

  const isPurchase = invoice.type === "purchase";
  const isModern = activeTemplate === "modern";
  const placeOfSupplyText = invoice.placeOfSupply ? `GST State Code: ${invoice.placeOfSupply}` : "N/A";

  const hasDiscount = invoice.lineItems?.some((line) => Number(line.discount) > 0) ?? false;
  const goldExchangePayments = invoice.payments?.filter((p) => p.method === "gold_exchange") || [];
  const hasGoldExchange = goldExchangePayments.length > 0;
  const grossInvoiceValue =
    Number(invoice.subtotal) +
    Number(invoice.cgstTotal) +
    Number(invoice.sgstTotal) +
    Number(invoice.igstTotal);

  // Define Template Switching controls
  const templatesList = [
    { id: "classic", name: "Classic" },
    { id: "modern", name: "Modern" },
    { id: "minimal", name: "Minimal" },
    { id: "compact", name: "Compact" },
    { id: "elegant", name: "Elegant" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                Live Invoice Preview
              </DialogTitle>
              <DialogDescription>
                Preview exactly how the customer bill and PDF outputs will look.
              </DialogDescription>
            </div>
            
            {/* Visual template quick-switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg w-fit text-xs font-semibold">
              <span className="text-muted-foreground px-2 flex items-center gap-1">
                <LayoutGrid className="h-3.5 w-3.5" /> Style:
              </span>
              {templatesList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTemplate === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            className={`w-full max-w-3xl bg-white dark:bg-slate-900 shadow-xl border rounded-sm transition-all duration-200 p-8 ${
              activeTemplate === "compact"
                ? "text-[11px] p-6 leading-tight max-w-2xl"
                : activeTemplate === "minimal"
                ? "font-sans border-slate-200 shadow-md p-10 text-slate-700"
                : activeTemplate === "elegant"
                ? "font-serif border-amber-200 shadow-amber-50/10 p-10 text-slate-800"
                : activeTemplate === "modern"
                ? "font-sans border-slate-200"
                : "font-sans"
            }`}
          >
            {/* Template Top Accent */}
            {activeTemplate === "modern" && <div className="h-2 bg-indigo-600 -mx-8 -mt-8 mb-6" />}

            {/* Document Header */}
            <div className="flex flex-col md:flex-row md:justify-between items-start mb-6 gap-4">
              <div className="space-y-1">
                {activeTemplate === "elegant" ? (
                  <h1 className="text-2xl font-bold font-serif text-blue-900 dark:text-blue-400 border-b-2 border-amber-500 pb-1 pr-6 uppercase tracking-wider">
                    {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
                  </h1>
                ) : activeTemplate === "modern" ? (
                  <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight">
                    {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
                  </h1>
                ) : activeTemplate === "minimal" ? (
                  <h1 className="text-xl font-light tracking-[0.2em] text-slate-900 dark:text-white uppercase pb-2 border-b">
                    {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    {isPurchase ? "Purchase Voucher" : invoice.status === "draft" ? "Draft Estimate" : "Tax Invoice"}
                  </h1>
                )}
                {activeTemplate === "modern" && (
                  <div className="text-sm font-semibold text-slate-500">Invoice No: {invoice.invoiceNumber}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Generated Format</div>
                <div className="font-semibold px-2 py-0.5 rounded bg-muted/65 text-xs inline-block capitalize border">
                  {activeTemplate} Layout
                </div>
              </div>
            </div>

            {/* Company & Bill Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-dashed mb-6">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{tenantName}</h3>
                <p className="text-xs text-muted-foreground leading-normal">{tenantAddress || "No address configured"}</p>
                {tenantPhone && <p className="text-xs text-muted-foreground">Phone: {tenantPhone}</p>}
                {tenantGstin && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">GSTIN: {tenantGstin}</p>}
              </div>

              <div className="md:text-right space-y-1 text-xs">
                {!isModern && (
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Invoice No: <span className="font-mono">{invoice.invoiceNumber}</span>
                  </p>
                )}
                <p><span className="text-muted-foreground">Date:</span> {invoice.invoiceDate}</p>
                {invoice.dueDate && <p><span className="text-muted-foreground">Due Date:</span> {invoice.dueDate}</p>}
                <p><span className="text-muted-foreground">Place of Supply:</span> {placeOfSupplyText}</p>
                <p className="uppercase"><span className="text-muted-foreground">Type:</span> {invoice.type}</p>
              </div>
            </div>

            {/* Billing To & Payment Status Card */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg mb-6 ${
              activeTemplate === "elegant"
                ? "bg-amber-50/40 border-l-4 border-amber-500 dark:bg-slate-900"
                : activeTemplate === "modern"
                ? "bg-slate-50 border-l-4 border-indigo-600 dark:bg-slate-900"
                : activeTemplate === "minimal"
                ? "bg-transparent border border-slate-200 dark:border-slate-800"
                : "bg-muted/30 border"
            }`}>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isPurchase ? "Supplier Details" : "Bill To"}
                </h4>
                {customer ? (
                  <>
                    <p className="font-semibold text-slate-900 dark:text-white">{customer.name}</p>
                    {customer.phone && <p>Phone: {customer.phone}</p>}
                    {customer.email && <p>Email: {customer.email}</p>}
                    <p className="leading-snug">Address: {formatCustomerAddress(customer.addressJson)}</p>
                    {customer.gstin && <p className="font-semibold">GSTIN: {customer.gstin}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Walk-in Customer</p>
                )}
              </div>

              <div className="space-y-1 text-xs md:text-right">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Status</h4>
                <p>Status: <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{invoice.status}</span></p>
                <p>Total Paid: ₹{Number(invoice.amountPaid).toFixed(2)}</p>
                <p className="font-bold text-rose-600">Balance Due: ₹{Number(invoice.balanceDue).toFixed(2)}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto mb-6">
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className={
                    activeTemplate === "modern"
                      ? "bg-indigo-600 hover:bg-indigo-600 text-white rounded-none"
                      : activeTemplate === "elegant"
                      ? "bg-blue-900 hover:bg-blue-900 text-white"
                      : activeTemplate === "compact"
                      ? "bg-slate-700 hover:bg-slate-700 text-white"
                      : "bg-slate-800 hover:bg-slate-800 text-white"
                  }>
                    <TableHead className="text-white font-semibold">Item Description</TableHead>
                    <TableHead className="text-white text-center font-semibold">Karat</TableHead>
                    <TableHead className="text-white text-right font-semibold">Weight (g)</TableHead>
                    <TableHead className="text-white text-right font-semibold">Rate</TableHead>
                    <TableHead className="text-white text-right font-semibold">Making</TableHead>
                    <TableHead className="text-white text-right font-semibold">Stone</TableHead>
                    {hasDiscount && <TableHead className="text-white text-right font-semibold">Discount</TableHead>}
                    <TableHead className="text-white text-right font-semibold">Taxable</TableHead>
                    <TableHead className="text-white text-right font-semibold">GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems?.map((line, idx) => {
                    const cgst = Number(line.cgstAmount);
                    const sgst = Number(line.sgstAmount);
                    const igst = Number(line.igstAmount);
                    const gstText = igst > 0 ? igst.toFixed(2) : (cgst + sgst).toFixed(2);
                    
                    const isAlternate = activeTemplate === "modern" && idx % 2 === 1;

                    return (
                      <TableRow
                        key={line.id || idx}
                        className={isAlternate ? "bg-slate-50 dark:bg-slate-900/60" : "hover:bg-transparent"}
                      >
                        <TableCell className="font-medium align-top py-3">{line.description}</TableCell>
                        <TableCell className="text-center align-top py-3">
                          {line.karat ? `${line.karat}K` : line.purityFineness ? parseFloat(line.purityFineness.toString()) : "-"}
                        </TableCell>
                        <TableCell className="text-right align-top py-3 whitespace-nowrap">
                          G: {Number(line.grossWeight).toFixed(3)}g<br />
                          <span className="text-[10px] text-muted-foreground">N: {Number(line.netWeight).toFixed(3)}g</span>
                        </TableCell>
                        <TableCell className="text-right align-top py-3">₹{Number(line.ratePerGram).toFixed(2)}</TableCell>
                        <TableCell className="text-right align-top py-3">₹{Number(line.makingCharge).toFixed(2)}</TableCell>
                        <TableCell className="text-right align-top py-3">₹{Number(line.stoneCharge).toFixed(2)}</TableCell>
                        {hasDiscount && (
                          <TableCell className="text-right align-top py-3 text-rose-600">
                            {Number(line.discount) > 0 ? `-₹${Number(line.discount).toFixed(2)}` : "-"}
                          </TableCell>
                        )}
                        <TableCell className="text-right align-top py-3">₹{Number(line.taxableValue).toFixed(2)}</TableCell>
                        <TableCell className="text-right align-top py-3">₹{gstText}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Bottom Summary Block */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-slate-200">
              <div className="md:col-span-3 space-y-4 text-[10px] text-muted-foreground leading-normal">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Amount in Words:</h4>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 italic text-[11px] font-medium mb-3">
                    {toIndianWords(Number(invoice.grandTotal))}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-0.5">Terms & Conditions:</h4>
                  <p>1. Goods once sold cannot be returned or exchanged.</p>
                  <p>2. Standard weight tolerances and purity apply.</p>
                  <p>3. Subject to local state jurisdiction.</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxable Subtotal:</span>
                  <span className="font-semibold">₹{Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {Number(invoice.cgstTotal) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST (1.5%):</span>
                      <span className="font-semibold">₹{Number(invoice.cgstTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST (1.5%):</span>
                      <span className="font-semibold">₹{Number(invoice.sgstTotal).toFixed(2)}</span>
                    </div>
                  </>
                )}
                {Number(invoice.igstTotal) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST (3.0%):</span>
                    <span className="font-semibold">₹{Number(invoice.igstTotal).toFixed(2)}</span>
                  </div>
                )}

                {hasGoldExchange && (
                  <>
                    <div className="flex justify-between border-t pt-1 text-[11px]">
                      <span className="text-muted-foreground">Total Invoice Value:</span>
                      <span className="font-semibold">₹{grossInvoiceValue.toFixed(2)}</span>
                    </div>
                    {goldExchangePayments.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between text-emerald-600 font-semibold text-[11px]">
                        <span>Old Gold Deduction ({p.exchangeMetalWeight ? Number(p.exchangeMetalWeight).toFixed(3) : "0.000"}g):</span>
                        <span>-₹{Number(p.exchangeMetalValue || p.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between border-t pt-1 border-slate-200">
                  <span className="text-muted-foreground">Round Off:</span>
                  <span className="font-semibold">₹{Number(invoice.roundOff).toFixed(2)}</span>
                </div>

                <div className={`flex justify-between border-t pt-2 text-sm font-extrabold ${
                  activeTemplate === "elegant"
                    ? "text-blue-900 border-t-2 border-b-2 border-amber-500 py-1"
                    : activeTemplate === "modern"
                    ? "text-indigo-600 border-t-2 border-indigo-600 py-1"
                    : "text-slate-900 dark:text-white"
                }`}>
                  <span>{hasGoldExchange ? "Net Payable:" : "Grand Total:"}</span>
                  <span>₹{Number(invoice.grandTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer declaration */}
            <div className="mt-8 text-center text-[10px] text-muted-foreground border-t pt-4 border-dashed">
              <p>This is a computer-generated GST invoice and does not require a physical signature.</p>
              <p className="font-medium text-slate-600 dark:text-slate-400 mt-1">Thank you for your business!</p>
            </div>
          </div>
        </div>

        {/* Modal Close Action */}
        <div className="p-4 border-t bg-muted/15 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
