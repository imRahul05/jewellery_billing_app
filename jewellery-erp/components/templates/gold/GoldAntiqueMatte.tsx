import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Landmark } from "lucide-react";

export function GoldAntiqueMatte({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fcf9f2] text-stone-900 font-serif p-6 rounded-lg shadow-sm border-2 border-stone-400 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-stone-400 text-stone-900">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-amber-800" />
          <span className="text-xs uppercase font-extrabold tracking-widest">Antique Matte Gold Heritage</span>
        </div>
        <span className="text-[11px] font-sans font-medium text-stone-700">Traditional Kemp & Matte 22K Ornaments</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-stone-300 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-stone-300 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-stone-300 font-sans">
          <thead>
            <tr className="bg-stone-800 text-amber-100 font-semibold">
              <th className="p-2 border-r border-stone-600 text-center w-8">#</th>
              <th className="p-2 border-r border-stone-600">Matte Finish Article</th>
              <th className="p-2 border-r border-stone-600 text-center">Purity</th>
              <th className="p-2 border-r border-stone-600 text-right">Net Wt</th>
              <th className="p-2 border-r border-stone-600 text-right">Rate/10g</th>
              <th className="p-2 border-r border-stone-600 text-right">Metal Val</th>
              <th className="p-2 border-r border-stone-600 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-stone-600 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-100/20">
                <td className="p-2 text-center border-r border-stone-300 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-stone-300">
                  <div className="font-bold text-stone-950 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-900 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-stone-300 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-stone-300 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-stone-300 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-stone-300 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-stone-300 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-stone-300 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-stone-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-stone-100 p-3 rounded border border-stone-300 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-700">
            <span>Taxable Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-stone-700">
              <span>GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Old Gold Exchange:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-stone-400 pt-1 text-sm font-bold text-stone-950 font-serif">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-stone-300 font-sans">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
