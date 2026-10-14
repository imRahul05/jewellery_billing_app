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
import { Coins } from "lucide-react";

export function GoldAkshayaTritiya({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fffefb] text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-yellow-500 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-yellow-500 bg-yellow-50 px-3 py-1.5 rounded font-sans text-yellow-950">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-600" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Akshaya Tritiya Shubh Suvarna Purchase</span>
        </div>
        <span className="text-[11px] font-medium text-yellow-800">Eternal Prosperity • BIS Certified</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-yellow-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-yellow-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-yellow-300 font-sans">
          <thead>
            <tr className="bg-yellow-800 text-yellow-100 font-semibold border-b border-yellow-600">
              <th className="p-2 border-r border-yellow-700 text-center w-8">#</th>
              <th className="p-2 border-r border-yellow-700">Auspicious Article</th>
              <th className="p-2 border-r border-yellow-700 text-center">Purity</th>
              <th className="p-2 border-r border-yellow-700 text-right">Net Wt</th>
              <th className="p-2 border-r border-yellow-700 text-right">Rate/10g</th>
              <th className="p-2 border-r border-yellow-700 text-right">Gold Val</th>
              <th className="p-2 border-r border-yellow-700 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-yellow-700 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-yellow-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-yellow-50/40">
                <td className="p-2 text-center border-r border-yellow-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-yellow-200">
                  <div className="font-bold text-neutral-900 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-yellow-800 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-yellow-200 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-yellow-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-yellow-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-yellow-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-yellow-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-yellow-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-yellow-50/60 p-3 rounded border border-yellow-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">Taxable Value:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-yellow-600 pt-1 text-sm font-bold text-yellow-950 font-serif">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-yellow-200 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
