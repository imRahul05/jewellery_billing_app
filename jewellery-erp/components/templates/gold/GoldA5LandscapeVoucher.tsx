import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export function GoldA5LandscapeVoucher({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-4 rounded-lg shadow-sm border border-amber-300 max-w-[850px] mx-auto text-xs print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[8px] p-1.5",
        className
      )}
    >
      <div className="flex justify-between items-center pb-2 border-b-2 border-amber-500">
        <div>
          <h2 className="text-base font-bold text-amber-950 uppercase">{seller.tradeName || seller.legalName}</h2>
          <p className="text-[10px] text-neutral-600">{seller.address.street}, {seller.address.city} • Ph: {seller.phone}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">Gold Retail Voucher (A5)</span>
          <span className="font-mono text-xs">No: <strong>{invoice.invoice.invoiceNumber}</strong></span>
          <span className="text-[10px] text-neutral-500 block">Date: {invoice.invoice.invoiceDate}</span>
        </div>
      </div>

      <div className="flex justify-between py-1.5 border-b border-amber-200 text-[11px] bg-amber-50/50 px-2 rounded mt-1">
        <div>Customer: <strong>{invoice.buyer.name || "Walk-in"}</strong> {invoice.buyer.phone && `(${invoice.buyer.phone})`}</div>
        {isGst && seller.gstin && <div className="font-mono text-[10px]">GSTIN: {seller.gstin}</div>}
      </div>

      <div className="my-2 overflow-x-auto">
        <table className="w-full text-left text-[11px] border-collapse border border-amber-200">
          <thead>
            <tr className="bg-amber-100 text-amber-950 font-bold border-b border-amber-300">
              <th className="p-1 border-r border-amber-200 text-center w-6">#</th>
              <th className="p-1 border-r border-amber-200">Ornament</th>
              <th className="p-1 border-r border-amber-200 text-center">Purity</th>
              <th className="p-1 border-r border-amber-200 text-right">Net Wt</th>
              <th className="p-1 border-r border-amber-200 text-right">Rate/10g</th>
              <th className="p-1 border-r border-amber-200 text-right">Gold Val</th>
              <th className="p-1 border-r border-amber-200 text-right">Making</th>
              <th className="p-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {goldItems.map((item, idx) => (
              <tr key={idx}>
                <td className="p-1 text-center border-r border-amber-200 font-mono">{idx + 1}</td>
                <td className="p-1 border-r border-amber-200">
                  <span className="font-semibold">{item.name}</span>
                  {item.huid && <span className="text-[9px] text-amber-800 ml-1">({item.huid})</span>}
                </td>
                <td className="p-1 text-center border-r border-amber-200 font-bold text-amber-800">{item.purity}</td>
                <td className="p-1 text-right border-r border-amber-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-1 text-right border-r border-amber-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-1 text-right border-r border-amber-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-1 text-right border-r border-amber-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="p-1 text-right font-bold font-mono">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1 border-t border-amber-300 text-xs items-center">
        <div className="text-[10px] text-neutral-600">
          <p className="font-semibold text-neutral-800">Terms &amp; Hallmark:</p>
          <p>BIS 100% Certified. Purity guaranteed.</p>
        </div>
        <div className="space-y-1 bg-amber-50 p-2 rounded border border-amber-200 text-right text-[11px]">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span className="text-neutral-600">GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Old Gold:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs border-t border-amber-300 pt-0.5 text-amber-950">
            <span>Net Payable:</span>
            <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
