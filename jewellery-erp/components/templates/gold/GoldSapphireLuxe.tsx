import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function GoldSapphireLuxe({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fcfdfd] text-slate-900 font-sans p-6 rounded-lg shadow-sm border border-blue-900/40 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-amber-300 p-3 rounded-t flex items-center justify-between mb-3 border-b-2 border-amber-400">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs uppercase font-bold tracking-widest">Sapphire Luxe High Jewellery</span>
        </div>
        <span className="text-[11px] text-blue-200">22K / 18K Hallmarked Gold</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-slate-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-slate-200 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-slate-200">
          <thead>
            <tr className="bg-blue-950 text-amber-200 font-semibold border-b border-amber-500">
              <th className="p-2 border-r border-blue-800 text-center w-8">#</th>
              <th className="p-2 border-r border-blue-800">Article</th>
              <th className="p-2 border-r border-blue-800 text-center">Purity</th>
              <th className="p-2 border-r border-blue-800 text-right">Net Wt</th>
              <th className="p-2 border-r border-blue-800 text-right">Rate/10g</th>
              <th className="p-2 border-r border-blue-800 text-right">Gold Val</th>
              <th className="p-2 border-r border-blue-800 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-blue-800 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30">
                <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200">
                  <div className="font-bold text-slate-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-blue-800 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-bold text-amber-800">{item.purity}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.metalValue)}</td>
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
        <div className="bg-blue-50/50 p-3 rounded border border-blue-200 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Taxable Total:</span>
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
          <div className="flex justify-between border-t border-blue-300 pt-1 text-sm font-bold text-blue-950">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
