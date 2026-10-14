import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export function GoldTwoToneDuo({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-neutral-800">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-600" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-800">Two-Tone Gold &amp; Platinum Atelier</span>
        </div>
        <span className="text-[11px] text-neutral-500 font-medium">Yellow Gold • White Gold • Dual Finish 18K/22K</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-neutral-300">
          <thead>
            <tr className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-amber-950 text-white font-semibold">
              <th className="p-2 border-r border-neutral-700 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-700">Two-Tone Article</th>
              <th className="p-2 border-r border-neutral-700 text-center">Purity</th>
              <th className="p-2 border-r border-neutral-700 text-right">Net Wt</th>
              <th className="p-2 border-r border-neutral-700 text-right">Rate/10g</th>
              <th className="p-2 border-r border-neutral-700 text-right">Gold Val</th>
              <th className="p-2 border-r border-neutral-700 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-neutral-700 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/20">
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-200">
                  <div className="font-bold text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-neutral-500 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-neutral-200 font-bold text-amber-700">{item.purity}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-neutral-50 p-3 rounded border border-neutral-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Taxable Subtotal:</span>
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
              <span>Old Gold Exchange:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-neutral-900 pt-1 text-sm font-bold text-neutral-950">
            <span>Net Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-neutral-200">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
