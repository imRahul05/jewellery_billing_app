import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";

export function GoldContemporaryLinear({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-mono p-6 rounded shadow-sm border border-neutral-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-neutral-900 text-neutral-900">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4" />
          <span className="text-xs uppercase font-bold tracking-widest font-sans">Linear Gold Studio</span>
        </div>
        <span className="text-[11px] font-sans font-medium text-neutral-600">Precision Certified Precious Metals</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-neutral-300">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-neutral-300 font-sans">
              <th className="p-2 border-r border-neutral-300 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-300">Description</th>
              <th className="p-2 border-r border-neutral-300 text-center">Purity</th>
              <th className="p-2 border-r border-neutral-300 text-right">Net Wt</th>
              <th className="p-2 border-r border-neutral-300 text-right">Rate/10g</th>
              <th className="p-2 border-r border-neutral-300 text-right">Metal Val</th>
              <th className="p-2 border-r border-neutral-300 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-neutral-300 text-right">Tax</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 text-center border-r border-neutral-300">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-300">
                  <div className="font-bold font-sans">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-neutral-500">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-neutral-300 font-semibold">{item.purity}</td>
                <td className="p-2 text-right border-r border-neutral-300">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-neutral-300">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-neutral-300">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-neutral-300">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-neutral-300">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-neutral-50 p-3 rounded border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex justify-between font-mono">
            <span className="text-neutral-600 font-sans">Subtotal Taxable:</span>
            <span>{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between font-mono">
              <span className="text-neutral-600 font-sans">GST Total:</span>
              <span>{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between font-mono text-emerald-700">
              <span className="font-sans">Less Exchange:</span>
              <span>-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-neutral-900 pt-1 text-sm font-bold font-mono">
            <span className="font-sans">Net Total:</span>
            <span className="text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-neutral-300 font-sans">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
