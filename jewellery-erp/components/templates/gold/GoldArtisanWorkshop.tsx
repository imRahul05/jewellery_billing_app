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
import { Wrench } from "lucide-react";

export function GoldArtisanWorkshop({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
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
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-neutral-900">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-neutral-700" />
          <span className="text-xs uppercase font-extrabold tracking-widest">Master Goldsmith Workshop &amp; Studio</span>
        </div>
        <span className="text-[11px] text-neutral-600 font-medium">Bespoke Handcrafted Jewellery &amp; Repairs</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-neutral-300">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-neutral-300">
              <th className="p-2 border-r border-neutral-300 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-300">Job Description</th>
              <th className="p-2 border-r border-neutral-300 text-center">Purity</th>
              <th className="p-2 border-r border-neutral-300 text-right">Net Wt</th>
              <th className="p-2 border-r border-neutral-300 text-right">Rate/10g</th>
              <th className="p-2 border-r border-neutral-300 text-right">Gold Val</th>
              <th className="p-2 border-r border-neutral-300 text-right">Workshop Labour</th>
              {isGst && <th className="p-2 border-r border-neutral-300 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 text-center border-r border-neutral-300 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-300">
                  <div className="font-bold text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-neutral-500 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-neutral-300 font-semibold text-amber-800">{item.purity}</td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.totalTax)}</td>}
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
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>GST (3%):</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-neutral-900 pt-1 text-sm font-bold text-neutral-950">
            <span>Net Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-200">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
