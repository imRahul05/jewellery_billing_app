import React from "react";
import { TemplateProps } from "@/types/template.types";
import { SilverItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function SilverMinimalSterling({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-200 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="border-b-2 border-neutral-900 pb-3 mb-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-neutral-400 block">
            925 Sterling Silver Studio
          </span>
          <h1 className="text-xl font-bold text-neutral-950">{seller.tradeName || seller.legalName}</h1>
        </div>
        <div className="text-right text-xs">
          <p className="font-mono font-bold text-neutral-900">{invoice.invoice.invoiceNumber}</p>
          <p className="text-neutral-500">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-900 text-neutral-900 font-bold uppercase text-[10px]">
              <th className="py-2 pr-2">Sterling Item</th>
              <th className="py-2 px-2 text-center">Fineness</th>
              <th className="py-2 px-2 text-right">Net Wt</th>
              <th className="py-2 px-2 text-right">Rate/10g</th>
              <th className="py-2 px-2 text-right">Metal Value</th>
              <th className="py-2 px-2 text-right">Making</th>
              <th className="py-2 pl-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {silverItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="py-2.5 pr-2">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.hallmarkNo && <div className="text-[10px] text-neutral-400 font-mono">Assay: {item.hallmarkNo}</div>}
                </td>
                <td className="py-2.5 px-2 text-center font-bold text-neutral-800">{item.purity}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatGrams(item.netWeight, 2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="py-2.5 pl-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
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

        <div className="space-y-2 text-xs border-t-2 border-neutral-900 pt-2">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal:</span>
            <span className="font-mono font-medium">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>Total Tax:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-extrabold text-neutral-950 border-t border-neutral-300 pt-2">
            <span>Grand Total:</span>
            <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[11px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-neutral-200 text-xs">
        <p className="text-[10px] text-neutral-500 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
