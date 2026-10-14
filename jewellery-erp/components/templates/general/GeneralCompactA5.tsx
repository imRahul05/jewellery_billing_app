import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export function GeneralCompactA5({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-4 rounded border border-neutral-300 max-w-[600px] mx-auto text-xs print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="text-center pb-2 border-b border-neutral-300">
        <h2 className="text-base font-bold uppercase">{seller.tradeName || seller.legalName}</h2>
        <p className="text-[11px] text-neutral-600">{seller.address.street}, {seller.address.city}</p>
        {isGst && seller.gstin && <p className="text-[10px] font-mono">GSTIN: {seller.gstin}</p>}
      </div>

      <div className="flex justify-between py-2 border-b border-neutral-200 text-[11px]">
        <span>Invoice: <strong className="font-mono">{invoice.invoice.invoiceNumber}</strong></span>
        <span>Date: {invoice.invoice.invoiceDate}</span>
      </div>

      <div className="my-2">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-400 font-bold">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {generalItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 font-medium">{item.name}</td>
                <td className="py-1 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="py-1 text-right font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="py-1 text-right font-bold font-mono">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 pt-2 border-t border-neutral-400 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span className="font-mono">{formatCurrency(summary.subtotal)}</span>
        </div>
        {isGst && (
          <div className="flex justify-between">
            <span>GST:</span>
            <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold border-t border-neutral-300 pt-1">
          <span>Grand Total:</span>
          <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-neutral-200 text-[10px]">
        <span>Computer Generated</span>
        <span className="font-mono">Authorized Signatory</span>
      </div>
    </div>
  );
}
