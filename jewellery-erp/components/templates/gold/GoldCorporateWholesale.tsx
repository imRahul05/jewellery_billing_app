import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";

export function GoldCorporateWholesale({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-slate-900 font-sans p-6 rounded shadow-sm border border-slate-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-900 text-slate-900">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          <span className="text-xs uppercase font-extrabold tracking-widest">B2B Bullion &amp; Wholesale Gold Trade</span>
        </div>
        <span className="text-[11px] font-medium text-slate-600">Wholesale Tax Invoice • Purity &amp; Melt Certified</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-slate-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-slate-200 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-slate-300 font-mono">
          <thead>
            <tr className="bg-slate-100 font-sans font-bold border-b border-slate-300">
              <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
              <th className="p-2 border-r border-slate-300">Lot Description</th>
              <th className="p-2 border-r border-slate-300 text-center">Fineness</th>
              <th className="p-2 border-r border-slate-300 text-right">Gross (g)</th>
              <th className="p-2 border-r border-slate-300 text-right">Net Gold (g)</th>
              <th className="p-2 border-r border-slate-300 text-right">Rate/10g</th>
              <th className="p-2 border-r border-slate-300 text-right">Making/Lot</th>
              {isGst && <th className="p-2 border-r border-slate-300 text-right">GST</th>}
              <th className="p-2 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2 text-center border-r border-slate-300">{idx + 1}</td>
                <td className="p-2 border-r border-slate-300 font-sans">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-slate-500 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-slate-300 font-bold">{item.purity}</td>
                <td className="p-2 text-right border-r border-slate-300">{formatGrams(item.grossWeight)}</td>
                <td className="p-2 text-right border-r border-slate-300 font-bold">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-slate-300">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-slate-300">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-slate-300">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between font-sans">
            <span className="text-slate-600">Taxable Trade Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between font-sans">
              <span className="text-slate-600">GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between font-sans text-emerald-700">
              <span>Less Old Gold Melt:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-slate-900 pt-1 text-sm font-bold font-sans">
            <span>Net Commercial Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-300">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
