"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Eye, LayoutGrid } from "lucide-react";
import { Prisma } from "@prisma/client";
import { TemplateRenderer } from "@/components/templates/TemplateRenderer";
import { adaptInvoiceToTemplateData } from "@/lib/billing/template-adapter";
import { TEMPLATES } from "@/constants/templates";

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
  templateId?: string | null;
  lineItems?: PreviewInvoiceLine[];
  payments?: Array<{
    id?: string;
    method: string;
    amount: string | number;
    exchangeMetalWeight?: string | number | null;
    exchangeMetalValue?: string | number | null;
    referenceNo?: string | null;
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
  const initialTemplate = useMemo(() => {
    if (!defaultTemplate) return "gold-classic-jewellers";
    const cleaned = defaultTemplate.split("_").pop() || "gold-classic-jewellers";
    if (cleaned === "classic") return "gold-classic-jewellers";
    if (cleaned === "modern") return "gold-modern-boutique";
    if (cleaned === "minimal") return "gold-minimal-karat";
    if (cleaned === "compact") return "gold-compact-counter";
    if (cleaned === "elegant") return "gold-royal-zari";
    return cleaned;
  }, [defaultTemplate]);

  const [activeTemplate, setActiveTemplate] = useState<string>(initialTemplate);

  const templateInvoiceData = useMemo(() => {
    return adaptInvoiceToTemplateData(
      invoice,
      customer,
      {
        name: tenantName,
        gstin: tenantGstin,
        address: tenantAddress,
        contactPhone: tenantPhone,
      },
      activeTemplate
    );
  }, [invoice, customer, tenantName, tenantGstin, tenantAddress, tenantPhone, activeTemplate]);

  const activeTemplateMeta = useMemo(() => {
    return TEMPLATES.find((t) => t.id === activeTemplate) || TEMPLATES[0];
  }, [activeTemplate]);

  const nonGoldPayments = invoice.payments?.filter((p) => p.method !== "gold_exchange") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[94vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 sm:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="h-5 w-5 text-indigo-600" />
                Live Invoice Preview
              </DialogTitle>
              <DialogDescription>
                Preview how the customer bill and PDF outputs will render across 40 specialized designs.
              </DialogDescription>
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-full md:w-auto text-xs font-semibold">
              <span className="text-muted-foreground px-2 flex items-center gap-1 shrink-0">
                <LayoutGrid className="h-3.5 w-3.5" /> Template:
              </span>
              <Select
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value)}
                className="w-full md:w-64 h-8 text-xs font-medium bg-background"
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category.toUpperCase()} • {t.paperSize})
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Document Container with live rendered template */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <TemplateRenderer invoice={templateInvoiceData} className="shadow-2xl" />
          </div>

          {/* Settlement / Balance Info Banner */}
          <div className="w-full max-w-[850px] mt-6 bg-card border rounded-lg p-4 text-xs space-y-2 shadow-sm">
            <div className="flex justify-between items-center font-bold text-sm">
              <span>Settlement Status</span>
              <span className={Number(invoice.balanceDue || 0) > 0 ? "text-amber-600" : "text-emerald-600"}>
                {Number(invoice.balanceDue || 0) > 0 ? "Partially Paid / Due" : "Fully Settled"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-muted-foreground">
              <div>
                <span>Grand Total:</span>
                <p className="font-semibold text-foreground">₹{Number(invoice.grandTotal || 0).toFixed(2)}</p>
              </div>
              <div>
                <span>Amount Paid:</span>
                <p className="font-semibold text-emerald-600">₹{Number(invoice.amountPaid || 0).toFixed(2)}</p>
              </div>
              <div>
                <span>Balance Due:</span>
                <p className={`font-semibold ${Number(invoice.balanceDue || 0) > 0 ? "text-amber-600" : "text-foreground"}`}>
                  ₹{Number(invoice.balanceDue || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <span>Active Template:</span>
                <p className="font-semibold text-foreground truncate">{activeTemplateMeta.name}</p>
              </div>
            </div>

            {nonGoldPayments.length > 0 && (
              <div className="pt-2 border-t flex flex-wrap gap-2 text-[11px]">
                <span className="text-muted-foreground">Payment Breakdown:</span>
                {nonGoldPayments.map((p, idx) => (
                  <span key={p.id || idx} className="bg-muted px-2 py-0.5 rounded font-mono">
                    {p.method.toUpperCase()}: ₹{Number(p.amount).toFixed(2)}
                  </span>
                ))}
              </div>
            )}
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
