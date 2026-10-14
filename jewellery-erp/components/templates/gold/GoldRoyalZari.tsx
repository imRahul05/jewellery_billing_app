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

export function GoldRoyalZari({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-stone-50 text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-yellow-700/60 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      {/* Royal Banner */}
      <div className="bg-amber-900 text-amber-100 p-2.5 rounded-t -mt-2 -mx-2 mb-4 flex items-center justify-between border-b border-amber-600">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span>Royal Heritage Jewellers Collection</span>
        </div>
        <div className="text-[10px] text-amber-200 flex items-center gap-1 font-sans">
          <Sparkles className="h-3 w-3 text-yellow-300" /> Purity & Trust
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-amber-700/40" />
      <BuyerDetailsBlock invoice={invoice} className="border-amber-700/30" />

      {/* Line Items Table with Royal Styling */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-700/40 font-sans">
          <thead>
            <tr className="bg-amber-900/10 text-amber-950 font-bold border-b border-amber-700/40 font-serif">
              <th className="p-2 border-r border-amber-700/20 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-700/20">Ornament Description</th>
              {isGst && <th className="p-2 border-r border-amber-700/20 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-amber-700/20 text-center">Purity</th>
              <th className="p-2 border-r border-amber-700/20 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-700/20 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-700/20 text-right">Gold Value</th>
              <th className="p-2 border-r border-amber-700/20 text-right">Making</th>
              <th className="p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-700/20">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50">
                <td className="p-2 text-center border-r border-amber-700/20 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-amber-700/20">
                  <div className="font-bold text-amber-950">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-800 font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800 font-medium">
                      Ex: {formatGrams(item.oldGoldExchange.weight)} = -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-amber-700/20 font-mono">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-amber-700/20 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-700/20 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-700/20 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-700/20 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-amber-700/20 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="p-2 text-right font-bold font-mono text-amber-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
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

        <div className="space-y-1.5 text-xs bg-amber-100/40 p-3.5 rounded border border-amber-300">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total Tax (GST):</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-medium">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-t border-amber-400 pt-1.5 font-serif">
            <span>Grand Total:</span>
            <span className="text-base font-mono font-sans">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <div className="text-[10px] text-neutral-700 font-serif italic pt-1">{summary.amountInWords}</div>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-amber-700/30 font-sans text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
