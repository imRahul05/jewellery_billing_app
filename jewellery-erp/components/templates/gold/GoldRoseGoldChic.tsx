import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

export function GoldRoseGoldChic({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-2xl shadow-sm border border-rose-200 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-rose-200">
        <div className="flex items-center gap-2 text-rose-900">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          <span className="text-xs uppercase font-bold tracking-widest text-rose-900">Rose Gold & Fine Jewels</span>
        </div>
        <span className="text-[11px] text-rose-700 font-medium">18K & 14K Rose Gold Atelier</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-rose-100" />
      <BuyerDetailsBlock invoice={invoice} className="border-rose-100 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-rose-100">
          <thead>
            <tr className="bg-rose-50/80 text-rose-950 font-semibold border-b border-rose-200">
              <th className="p-2 border-r border-rose-200 text-center w-8">#</th>
              <th className="p-2 border-r border-rose-200">Design</th>
              <th className="p-2 border-r border-rose-200 text-center">Karat</th>
              <th className="p-2 border-r border-rose-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-rose-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-rose-200 text-right">Metal Val</th>
              <th className="p-2 border-r border-rose-200 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-rose-200 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-rose-50/30">
                <td className="p-2 text-center border-r border-rose-100 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-rose-100">
                  <div className="font-semibold text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-rose-700 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-rose-100 font-bold text-rose-800">{item.purity}</td>
                <td className="p-2 text-right border-r border-rose-100 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-rose-100 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-rose-100 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-rose-100 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-rose-100 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Taxable:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-rose-200 pt-1 text-sm font-bold text-rose-950">
            <span>Total Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-rose-100">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
