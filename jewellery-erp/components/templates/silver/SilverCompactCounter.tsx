import React from "react";
import { TemplateProps } from "@/types/template.types";
import { SilverItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export function SilverCompactCounter({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

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
        <div>
          <span>Bill No: <strong className="font-mono">{invoice.invoice.invoiceNumber}</strong></span>
          <span className="block">Date: {invoice.invoice.invoiceDate}</span>
        </div>
        <div className="text-right">
          <span>Customer: <strong>{invoice.buyer.name || "Cash"}</strong></span>
        </div>
      </div>

      <div className="my-2">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-400 font-bold">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Purity</th>
              <th className="py-1 text-right">Net Wt</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {silverItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 font-medium">{item.name}</td>
                <td className="py-1 text-center">{item.purity}</td>
                <td className="py-1 text-right font-mono">{formatGrams(item.netWeight, 2)}</td>
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
            <span>Tax:</span>
            <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold border-t border-neutral-300 pt-1">
          <span>Grand Total:</span>
          <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-neutral-200 text-[10px]">
        <span>Thank you for your visit!</span>
        <span className="font-mono">Authorized Signatory</span>
      </div>
    </div>
  );
}
