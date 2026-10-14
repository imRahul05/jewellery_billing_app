import React from "react";
import { TemplateProps } from "@/types/template.types";
import { SilverItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function SilverBoutiqueSilver({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-xl shadow-lg border border-slate-100 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Pure Silver Studio</span>
          <h1 className="text-2xl font-light tracking-wide uppercase text-slate-900">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-slate-500">{seller.address.street}, {seller.address.city}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-slate-900 border-b border-slate-900 pb-0.5">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-xs text-slate-500 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-slate-100 bg-slate-50/50" />

      <div className="my-5 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-900 text-slate-900 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5">Item</th>
              <th className="py-2.5 text-center">Purity</th>
              <th className="py-2.5 text-right">Net Wt</th>
              <th className="py-2.5 text-right">Rate/10g</th>
              <th className="py-2.5 text-right">Making</th>
              <th className="py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {silverItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium text-slate-900">
                  {item.name}
                  {item.isFiligree && <span className="block text-[9px] text-amber-700">★ Cuttack Silver Filigree</span>}
                </td>
                <td className="py-3 text-center text-slate-600 font-mono">{item.purity}</td>
                <td className="py-3 text-right text-slate-600 font-mono">{formatGrams(item.netWeight, 2)}</td>
                <td className="py-3 text-right text-slate-600 font-mono">{formatCurrency(item.ratePer10g)}</td>
                <td className="py-3 text-right text-slate-600 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="py-3 text-right font-medium text-slate-900 font-mono">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
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

        <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl">
          <div className="flex justify-between text-slate-500">
            <span>Metal Value</span>
            <span className="font-mono text-slate-900">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-slate-500">
              <span>Tax (GST)</span>
              <span className="font-mono text-slate-900 font-medium">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-light text-slate-950 border-t border-slate-200 pt-2">
            <span>Total Payable</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-serif italic">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-slate-100 text-xs">
        <p className="text-[10px] text-slate-400 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
