import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export function GoldThermalReceipt58mm({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-black font-mono p-2 border border-dashed border-neutral-400 max-w-[260px] mx-auto text-[10px] leading-tight print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[7px] p-1",
        className
      )}
    >
      <div className="text-center pb-1 border-b border-black">
        <h2 className="text-xs font-bold uppercase">{seller.tradeName || seller.legalName}</h2>
        <p className="text-[9px]">{seller.address.city} • {seller.phone}</p>
        {isGst && seller.gstin && <p className="text-[8px]">GST: {seller.gstin}</p>}
      </div>

      <div className="py-1 border-b border-black text-[9px]">
        <div>INV: {invoice.invoice.invoiceNumber}</div>
        <div>DATE: {invoice.invoice.invoiceDate}</div>
        <div>CUST: {invoice.buyer.name || "CASH"}</div>
      </div>

      <div className="py-1 border-b border-black space-y-1">
        {goldItems.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between font-bold">
              <span className="truncate max-w-[150px]">{item.name}</span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
            <div className="flex justify-between text-[8px] text-neutral-700">
              <span>{item.purity} • {formatGrams(item.netWeight)}</span>
              {item.huid && <span>HUID:{item.huid}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="py-1 border-b border-black space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(summary.taxableAmount)}</span>
        </div>
        {isGst && (
          <div className="flex justify-between">
            <span>GST:</span>
            <span>{formatCurrency(summary.totalTax)}</span>
          </div>
        )}
        {summary.totalExchangeDeduction > 0 && (
          <div className="flex justify-between text-emerald-800">
            <span>OLD GOLD:</span>
            <span>-{formatCurrency(summary.totalExchangeDeduction)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[11px] border-t border-black pt-0.5">
          <span>TOTAL:</span>
          <span>{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      <div className="pt-1 text-center text-[8px] text-neutral-600">
        <p>BIS 100% Hallmarked Jewellery</p>
        <p>Thank You • Visit Again</p>
      </div>
    </div>
  );
}
