import React from "react";
import { InvoiceData } from "@/types/invoice.types";
import { cn } from "@/lib/utils";

interface TemplateHeaderProps {
  invoice: InvoiceData;
  className?: string;
  themeColor?: string;
  titleAlign?: "left" | "right" | "center";
}

export function TemplateHeader({
  invoice,
  className,
  titleAlign = "right",
}: TemplateHeaderProps) {
  const { seller, invoice: meta, billingMode } = invoice;
  const isGst = billingMode === "gst";

  const getDocTitle = () => {
    switch (meta.invoiceType) {
      case "tax_invoice":
        return "TAX INVOICE";
      case "bill_of_supply":
        return "BILL OF SUPPLY";
      case "cash_memo":
        return "CASH MEMO";
      case "proforma_invoice":
        return "PROFORMA INVOICE";
      case "quotation":
        return "QUOTATION";
      case "estimate":
        return "ESTIMATE";
      case "delivery_challan":
        return "DELIVERY CHALLAN";
      default:
        return isGst ? "TAX INVOICE" : "BILL OF SUPPLY";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-neutral-300 text-neutral-900",
        className
      )}
    >
      {/* Seller Logo & Name */}
      <div className="flex items-start gap-3 max-w-[65%]">
        {seller.logoBase64 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seller.logoBase64}
            alt="Business Logo"
            className="h-16 w-auto max-w-[140px] object-contain rounded"
          />
        )}
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950 uppercase font-serif">
            {seller.tradeName || seller.legalName || "Your Business Name"}
          </h1>
          {seller.legalName && seller.legalName !== seller.tradeName && (
            <p className="text-xs text-neutral-600 font-medium">
              ({seller.legalName})
            </p>
          )}
          <p className="text-xs text-neutral-600 leading-relaxed">
            {seller.address.street}, {seller.address.city}, {seller.address.state} - {seller.address.pincode}
          </p>
          <div className="flex flex-wrap gap-x-3 text-xs text-neutral-700 font-medium pt-0.5">
            {seller.phone && <span>Tel: {seller.phone}</span>}
            {seller.email && <span>Email: {seller.email}</span>}
          </div>
          {isGst && seller.gstin && (
            <div className="flex flex-wrap gap-x-3 text-xs font-semibold text-neutral-900 pt-1">
              <span>GSTIN: <span className="font-mono">{seller.gstin}</span></span>
              {seller.pan && <span>PAN: <span className="font-mono">{seller.pan}</span></span>}
              <span>State Code: <span className="font-mono">{seller.address.stateCode}</span></span>
            </div>
          )}
          {seller.compositionScheme && (
            <p className="text-[10px] text-neutral-600 font-medium italic pt-0.5">
              Composition taxable person, not eligible to collect tax on supplies.
            </p>
          )}
        </div>
      </div>

      {/* Invoice Title & Meta */}
      <div
        className={cn(
          "text-right space-y-1",
          titleAlign === "center" ? "text-center" : titleAlign === "left" ? "text-left" : "text-right"
        )}
      >
        <div className="inline-block px-3 py-1 bg-neutral-900 text-white rounded font-bold text-sm tracking-wider uppercase">
          {getDocTitle()}
        </div>
        <div className="text-xs space-y-0.5 text-neutral-700 font-medium pt-1">
          <p>
            <span className="text-neutral-500">Invoice No: </span>
            <span className="font-bold text-neutral-950 font-mono">{meta.invoiceNumber}</span>
          </p>
          <p>
            <span className="text-neutral-500">Date: </span>
            <span className="font-semibold text-neutral-900">{meta.invoiceDate}</span>
          </p>
          {meta.dueDate && (
            <p>
              <span className="text-neutral-500">Due Date: </span>
              <span className="font-semibold text-neutral-900">{meta.dueDate}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
