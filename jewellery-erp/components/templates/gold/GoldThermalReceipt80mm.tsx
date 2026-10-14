import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { cn } from "@/lib/utils";

export function GoldThermalReceipt80mm({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-black font-mono p-4 border border-dashed border-neutral-400 max-w-[340px] mx-auto text-xs leading-tight print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[8px] p-1.5",
        className
      )}
    >
      {/* Store Header */}
      <div className="text-center pb-2 border-b border-black space-y-0.5">
        <h2 className="text-sm font-bold uppercase tracking-wider">{seller.tradeName || seller.legalName}</h2>
        <p className="text-[10px]">{seller.address.street}, {seller.address.city}</p>
        <p className="text-[10px]">Tel: {seller.phone}</p>
        {isGst && seller.gstin && <p className="text-[10px] font-bold">GSTIN: {seller.gstin}</p>}
      </div>

      {/* Invoice Details */}
      <div className="py-2 border-b border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>INVOICE: <strong>{invoice.invoice.invoiceNumber}</strong></span>
          <span>DATE: {invoice.invoice.invoiceDate}</span>
        </div>
        <div className="flex justify-between">
          <span>CUSTOMER: <strong>{invoice.buyer.name || "CASH"}</strong></span>
          <span>POS: {invoice.buyer.placeOfSupply || "STATE"}</span>
        </div>
      </div>

      {/* Itemized Gold Items */}
      <div className="py-2 border-b border-black space-y-2">
        {goldItems.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>{idx + 1}. {item.name}</span>
              <span>{formatCurrency(item.lineTotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-700">
              <span>{item.purity} • Net: {formatGrams(item.netWeight)}</span>
              <span>Rate: {formatCurrency(item.ratePer10g, { decimals: 0 })}/10g</span>
            </div>
            <div className="flex justify-between text-[10px] text-neutral-700">
              <span>Making: {formatCurrency(item.makingChargeAmount)}</span>
              {item.huid && <span>HUID: {item.huid}</span>}
            </div>
            {item.oldGoldExchange?.enabled && (
              <div className="flex justify-between text-[10px] font-semibold text-emerald-800">
                <span>Old Gold Less ({formatGrams(item.oldGoldExchange.weight)}):</span>
                <span>-{formatCurrency(item.oldGoldExchange.totalDeduction)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Totals */}
      <div className="py-2 border-b border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Taxable Subtotal:</span>
          <span>{formatCurrency(summary.taxableAmount)}</span>
        </div>
        {isGst && (
          <div className="flex justify-between">
            <span>GST Total (3%):</span>
            <span>{formatCurrency(summary.totalTax)}</span>
          </div>
        )}
        {summary.totalExchangeDeduction > 0 && (
          <div className="flex justify-between font-bold text-emerald-800">
            <span>Old Gold Exchange:</span>
            <span>-{formatCurrency(summary.totalExchangeDeduction)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-sm border-t border-black pt-1">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      {/* QR & Footer */}
      <div className="pt-2 text-center space-y-2">
        <div className="flex justify-center">
          <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} className="p-0 border-none bg-transparent" />
        </div>
        <p className="text-[9px] text-neutral-600">
          * BIS 100% Hallmarked Jewellery Guarantee *<br />
          Thank You for Shopping with Us!
        </p>
      </div>
    </div>
  );
}
