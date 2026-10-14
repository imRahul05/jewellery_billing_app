import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GroceryItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GroceryKiranaClassic({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-emerald-300 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="h-1.5 bg-emerald-600 rounded-t mb-3" />
      <TemplateHeader invoice={invoice} className="border-emerald-300" />
      <BuyerDetailsBlock invoice={invoice} className="border-emerald-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-emerald-300 border-collapse">
          <thead>
            <tr className="bg-emerald-100/70 text-emerald-950 font-bold border-b border-emerald-300">
              <th className="p-2 border-r border-emerald-200 text-center w-8">#</th>
              <th className="p-2 border-r border-emerald-200">Item / Commodity</th>
              {isGst && <th className="p-2 border-r border-emerald-200 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-emerald-200 text-center">Type</th>
              <th className="p-2 border-r border-emerald-200 text-center">Qty / Unit</th>
              <th className="p-2 border-r border-emerald-200 text-right">Rate</th>
              {isGst && <th className="p-2 border-r border-emerald-200 text-center">GST%</th>}
              <th className="p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/40">
                <td className="p-2 text-center border-r border-emerald-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-emerald-200 font-semibold text-neutral-950">
                  {item.name}
                  {item.discountAmount > 0 && (
                    <span className="block text-[10px] text-emerald-700 font-normal">
                      Disc: -{formatCurrency(item.discountAmount)}
                    </span>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-emerald-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-emerald-200">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                      item.isPackaged ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                    )}
                  >
                    {item.isPackaged ? "Packaged" : "Loose"}
                  </span>
                </td>
                <td className="p-2 text-center border-r border-emerald-200 font-medium">
                  {item.quantity} {item.unit}
                </td>
                <td className="p-2 text-right border-r border-emerald-200 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                {isGst && (
                  <td className="p-2 text-center border-r border-emerald-200 font-mono">
                    {item.gstRate === 0 ? "0% (Nil)" : `${item.gstRate}%`}
                  </td>
                )}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>
          {isGst && <TaxSummaryTable summary={summary} />}
          {other.showUpiQr && seller.upiId && (
            <UpiQrBlock
              upiId={seller.upiId}
              payeeName={seller.tradeName || seller.legalName}
              grandTotal={summary.grandTotal}
              invoiceNumber={invoice.invoice.invoiceNumber}
            />
          )}
        </div>

        <div className="space-y-1.5 text-xs bg-emerald-50/50 p-3.5 rounded border border-emerald-300">
          <div className="flex justify-between text-neutral-700">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Savings / Discount:</span>
              <span className="font-mono">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between text-neutral-700">
              <span>Total GST:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.roundOffAmount !== 0 && (
            <div className="flex justify-between text-neutral-600 text-[11px]">
              <span>Round-off:</span>
              <span className="font-mono">
                {summary.roundOffAmount > 0 ? `+${formatCurrency(summary.roundOffAmount)}` : formatCurrency(summary.roundOffAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-emerald-950 border-t-2 border-emerald-400 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-emerald-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function GroceryFreshMart({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border border-neutral-300 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="bg-emerald-700 text-white p-3 rounded-t mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-emerald-100">{seller.address.street}, {seller.address.city}</p>
        </div>
        <div className="text-right text-xs">
          <span className="px-2.5 py-1 bg-emerald-900 text-white font-mono font-bold rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-emerald-200 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      {/* Savings Highlight */}
      {summary.totalDiscounts > 0 && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded my-2 text-xs text-emerald-900 font-bold text-center">
          🎉 YOU SAVED {formatCurrency(summary.totalDiscounts)} ON THIS PURCHASE!
        </div>
      )}

      <div className="my-3 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-neutral-900 font-bold border-b border-neutral-300">
              <th className="p-2 border-r border-neutral-300">Item</th>
              <th className="p-2 border-r border-neutral-300 text-center">Tag</th>
              <th className="p-2 border-r border-neutral-300 text-center">Qty</th>
              <th className="p-2 border-r border-neutral-300 text-right">Rate</th>
              {isGst && <th className="p-2 border-r border-neutral-300 text-center">GST%</th>}
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 border-r border-neutral-300 font-semibold">{item.name}</td>
                <td className="p-2 text-center border-r border-neutral-300 text-[10px]">
                  {item.isPackaged ? "Packaged" : "Loose"}
                </td>
                <td className="p-2 text-center border-r border-neutral-300 font-mono">
                  {item.quantity} {item.unit}
                </td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                {isGst && <td className="p-2 text-center border-r border-neutral-300 font-mono">{item.gstRate}%</td>}
                <td className="p-2 text-right font-bold font-mono">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>
          {isGst && <TaxSummaryTable summary={summary} />}
          {other.showUpiQr && seller.upiId && (
            <UpiQrBlock
              upiId={seller.upiId}
              payeeName={seller.tradeName || seller.legalName}
              grandTotal={summary.grandTotal}
              invoiceNumber={invoice.invoice.invoiceNumber}
            />
          )}
        </div>

        <div className="space-y-1.5 text-xs bg-neutral-50 p-3.5 rounded border border-neutral-300">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Discount:</span>
              <span className="font-mono">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between">
              <span>Total GST:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-neutral-900 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-neutral-200 text-xs">
        <p className="text-[10px] text-neutral-500 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
