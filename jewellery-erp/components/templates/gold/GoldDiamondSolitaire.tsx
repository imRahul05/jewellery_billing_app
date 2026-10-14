import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Gem, ShieldCheck } from "lucide-react";

export function GoldDiamondSolitaire({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-xl shadow-md border border-slate-200 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-slate-800">
          <Gem className="h-5 w-5 text-cyan-600" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700">Diamond & Gold Solitaire Atelier</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>IGI / GIA Certified Diamond & BIS 916 Gold</span>
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-slate-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-slate-200 my-2" />

      {/* Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="p-2 border-r border-slate-700 text-center w-8">#</th>
              <th className="p-2 border-r border-slate-700">Design & Diamond Specs</th>
              <th className="p-2 border-r border-slate-700 text-center">Gold Purity</th>
              <th className="p-2 border-r border-slate-700 text-right">Gross Wt</th>
              <th className="p-2 border-r border-slate-700 text-right">Net Gold</th>
              <th className="p-2 border-r border-slate-700 text-right">Gold Rate</th>
              <th className="p-2 border-r border-slate-700 text-right">Making/Setting</th>
              {isGst && <th className="p-2 border-r border-slate-700 text-right">GST</th>}
              <th className="p-2 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-cyan-700 font-medium">Certified Studded Jewellery (VS-SI / EF Grade)</div>
                  {item.huid && <div className="text-[10px] text-slate-500 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-bold text-amber-700">{item.purity}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatGrams(item.grossWeight)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono font-medium">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-slate-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Taxable Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-slate-600">
              <span>GST (3%):</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Old Gold Exchange:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-slate-300 pt-1 text-sm font-black text-slate-900">
            <span>Net Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-200">
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
