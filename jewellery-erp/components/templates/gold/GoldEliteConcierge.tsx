import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Crown, Sparkles } from "lucide-react";

export function GoldEliteConcierge({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#141414] text-neutral-100 font-sans p-6 rounded-xl shadow-2xl border border-amber-600/60 max-w-[850px] mx-auto print:bg-white print:text-neutral-900 print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-600/40">
        <div className="flex items-center gap-2 text-amber-400">
          <Crown className="h-5 w-5" />
          <span className="text-xs uppercase font-extrabold tracking-[0.25em]">Elite Private Salon Concierge</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
          <Sparkles className="h-3.5 w-3.5" />
          <span>VIP Bespoke High Jewellery</span>
        </div>
      </div>

      <div className="print:invert">
        <TemplateHeader invoice={invoice} className="border-amber-600/30 text-neutral-100" />
      </div>
      <BuyerDetailsBlock invoice={invoice} className="border-amber-600/30 my-2 bg-neutral-900/50 text-neutral-100" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-600/40">
          <thead>
            <tr className="bg-neutral-900 text-amber-300 font-semibold border-b border-amber-600/40">
              <th className="p-2 border-r border-amber-600/30 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-600/30">Masterpiece Description</th>
              <th className="p-2 border-r border-amber-600/30 text-center">Fineness</th>
              <th className="p-2 border-r border-amber-600/30 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-600/30 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-600/30 text-right">Gold Val</th>
              <th className="p-2 border-r border-amber-600/30 text-right">Atelier</th>
              {isGst && <th className="p-2 border-r border-amber-600/30 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-900/40">
                <td className="p-2 text-center border-r border-amber-600/30 font-mono text-amber-400">{idx + 1}</td>
                <td className="p-2 border-r border-amber-600/30">
                  <div className="font-bold text-white">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-300 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-amber-600/30 font-bold text-amber-400">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-600/30 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-600/30 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-600/30 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-amber-600/30 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-amber-600/30 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-amber-300">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div className="bg-neutral-900 p-3 rounded border border-amber-600/30">
          {isGst && <TaxSummaryTable summary={summary} />}
        </div>
        <div className="bg-neutral-900 p-3 rounded border border-amber-600/40 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Taxable Subtotal:</span>
            <span className="font-mono text-white">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-400">
              <span>GST Total:</span>
              <span className="font-mono text-white">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-amber-500/60 pt-1 text-sm font-bold text-amber-300">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base text-amber-400">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-amber-600/40">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
