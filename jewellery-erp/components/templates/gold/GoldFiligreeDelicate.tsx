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
import { Feather } from "lucide-react";

export function GoldFiligreeDelicate({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-amber-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-dashed border-amber-400 text-amber-900">
        <div className="flex items-center gap-2">
          <Feather className="h-4 w-4 text-amber-600" />
          <span className="text-xs uppercase font-semibold tracking-wider font-serif">Tarkasi Gold Filigree Studio</span>
        </div>
        <span className="text-[11px] text-amber-800">Precision Wire-Mesh Handcrafted 22K</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-amber-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-amber-200 my-2" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-200">
          <thead>
            <tr className="bg-amber-50 text-amber-950 font-semibold border-b border-amber-300">
              <th className="p-2 border-r border-amber-200 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-200">Filigree Artwork</th>
              <th className="p-2 border-r border-amber-200 text-center">Purity</th>
              <th className="p-2 border-r border-amber-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-200 text-right">Metal Val</th>
              <th className="p-2 border-r border-amber-200 text-right">Artisan Labour</th>
              {isGst && <th className="p-2 border-r border-amber-200 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/30">
                <td className="p-2 text-center border-r border-amber-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-amber-200">
                  <div className="font-semibold text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-800 font-mono">HUID: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-amber-200 font-bold text-amber-800">{item.purity}</td>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-amber-50/50 p-3 rounded border border-amber-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">Taxable Subtotal:</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>GST (3%):</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-amber-300 pt-1 text-sm font-bold text-amber-950 font-serif">
            <span>Net Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-amber-200">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
