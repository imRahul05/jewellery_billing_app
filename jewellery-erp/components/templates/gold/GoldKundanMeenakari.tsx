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
import { Flower2 } from "lucide-react";

export function GoldKundanMeenakari({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fffdfa] text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-rose-300 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-rose-400 bg-rose-50/80 px-3 py-1.5 rounded text-rose-950">
        <div className="flex items-center gap-2">
          <Flower2 className="h-4 w-4 text-rose-700" />
          <span className="text-xs uppercase font-bold tracking-wider">Jaipur Kundan & Meenakari Gold</span>
        </div>
        <span className="text-[11px] font-sans font-medium text-rose-800">22K Handcrafted Enamel & Jadau</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-rose-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-rose-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-rose-200">
          <thead>
            <tr className="bg-rose-900 text-rose-100 font-sans font-semibold">
              <th className="p-2 border-r border-rose-700 text-center w-8">#</th>
              <th className="p-2 border-r border-rose-700">Artisan Ornaments</th>
              {isGst && <th className="p-2 border-r border-rose-700 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-rose-700 text-center">Purity</th>
              <th className="p-2 border-r border-rose-700 text-right">Net Wt</th>
              <th className="p-2 border-r border-rose-700 text-right">Gold Rate</th>
              <th className="p-2 border-r border-rose-700 text-right">Kundan Karigari</th>
              {isGst && <th className="p-2 border-r border-rose-700 text-right">GST</th>}
              <th className="p-2 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100 font-sans">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-rose-50/30">
                <td className="p-2 text-center border-r border-rose-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-rose-200">
                  <div className="font-bold text-neutral-950 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-rose-800 font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800">
                      Exchange ({formatGrams(item.oldGoldExchange.weight)}): -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-rose-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-rose-200 font-bold text-amber-800">{item.purity}</td>
                <td className="p-2 text-right border-r border-rose-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-rose-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-rose-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-rose-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-rose-50/70 p-3 rounded border border-rose-200 space-y-1.5 text-xs">
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
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-rose-300 pt-1 text-sm font-bold text-rose-950 font-serif">
            <span>Net Payable Amount:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-rose-200 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
