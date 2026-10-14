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

export function GoldTempleGold({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fdfaf5] text-neutral-900 font-sans p-6 rounded-lg border border-amber-300 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="bg-amber-800 text-amber-50 text-center py-1 text-xs font-serif tracking-widest uppercase rounded-t mb-2">
        ॥ Traditional Temple Jewellery & Heritage Ornaments ॥
      </div>
      <TemplateHeader invoice={invoice} className="border-amber-300" />
      <BuyerDetailsBlock invoice={invoice} className="border-amber-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-amber-300 border-collapse">
          <thead>
            <tr className="bg-amber-100/80 text-amber-950 font-bold border-b border-amber-300">
              <th className="p-2 border-r border-amber-200 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-200">Article Description</th>
              <th className="p-2 border-r border-amber-200 text-center">Purity</th>
              <th className="p-2 border-r border-amber-200 text-right">Gross Wt</th>
              <th className="p-2 border-r border-amber-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-200 text-right">Gold Value</th>
              <th className="p-2 border-r border-amber-200 text-right">Wastage/Making</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/50">
                <td className="p-2 text-center border-r border-amber-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-amber-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-800 font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800">
                      Less Return: -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                <td className="p-2 text-center border-r border-amber-200 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatGrams(item.grossWeight)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono font-semibold">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
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

        <div className="space-y-1.5 text-xs bg-amber-100/50 p-3.5 rounded border border-amber-300">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total GST:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-medium">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-t border-amber-400 pt-1.5">
            <span>Total Payable:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-700 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-amber-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
