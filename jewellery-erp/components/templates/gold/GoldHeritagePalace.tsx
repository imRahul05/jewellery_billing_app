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
import { Crown, Sparkles } from "lucide-react";

export function GoldHeritagePalace({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fdfbf7] text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-amber-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      {/* Royal Palace Header Trim */}
      <div className="flex items-center justify-between border-b-2 border-amber-400 pb-2 mb-3 bg-gradient-to-r from-sky-950 via-indigo-950 to-sky-950 text-amber-300 px-4 py-2 rounded-t">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-300" />
          <span className="text-xs uppercase tracking-widest font-sans font-bold">Heritage Palace Collection</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-sans text-amber-200">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Royal Court Hallmark Guarantee</span>
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-amber-300 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-amber-300/80 my-2 font-sans" />

      {/* Gold Items Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-300">
          <thead>
            <tr className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 text-amber-200 font-sans font-semibold border-b border-amber-400">
              <th className="p-2 border-r border-amber-700 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-700">Ornament & Karigari</th>
              {isGst && <th className="p-2 border-r border-amber-700 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-amber-700 text-center">Purity</th>
              <th className="p-2 border-r border-amber-700 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-700 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-700 text-right">Gold Val</th>
              <th className="p-2 border-r border-amber-700 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-amber-700 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-200 font-sans">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-100/30">
                <td className="p-2 text-center border-r border-amber-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-amber-200">
                  <div className="font-bold text-neutral-950 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-800 font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800">
                      Less Old Gold ({formatGrams(item.oldGoldExchange.weight)}): -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-amber-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-amber-200 font-semibold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-amber-50/80 p-3 rounded border border-amber-300 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">Total Taxable Value:</span>
            <span className="font-mono font-medium">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>Total GST:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Old Gold Exchange:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-amber-400 pt-1 text-sm font-bold text-sky-950 font-serif">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-sans my-2 p-2 bg-amber-100/50 rounded border border-amber-200">
        <span className="font-semibold text-neutral-700">Amount in Words: </span>
        <span className="italic font-serif">{summary.amountInWords}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-amber-300 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
