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

export function GoldBilingualHindi({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fffef8] text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-red-800 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="text-center pb-2 mb-3 border-b-2 border-red-800 text-red-900">
        <div className="text-sm font-bold tracking-wider">॥ श्री गणेशाय नमः ॥</div>
        <div className="text-xs uppercase font-extrabold tracking-widest mt-0.5">स्वर्ण आभूषण पक्का बिल (Tax Invoice)</div>
      </div>

      <TemplateHeader invoice={invoice} className="border-red-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-red-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-red-300 font-sans">
          <thead>
            <tr className="bg-red-900 text-amber-200 font-semibold border-b border-red-800">
              <th className="p-2 border-r border-red-700 text-center w-8">#</th>
              <th className="p-2 border-r border-red-700">आभूषण विवरण (Description)</th>
              <th className="p-2 border-r border-red-700 text-center">शुद्धता (Karat)</th>
              <th className="p-2 border-r border-red-700 text-right">वजन (Net Wt)</th>
              <th className="p-2 border-r border-red-700 text-right">भाव (Rate/10g)</th>
              <th className="p-2 border-r border-red-700 text-right">सोना मूल्य (Gold Val)</th>
              <th className="p-2 border-r border-red-700 text-right">मजूरी (Making)</th>
              {isGst && <th className="p-2 border-r border-red-700 text-right">जीएसटी (GST)</th>}
              <th className="p-2 text-right">कुल रकम (Total)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-red-50/40">
                <td className="p-2 text-center border-r border-red-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-red-200">
                  <div className="font-bold text-neutral-900 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-red-800 font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800">
                      पुराना सोना वापसी ({formatGrams(item.oldGoldExchange.weight)}): -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                <td className="p-2 text-center border-r border-red-200 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-red-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-red-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-red-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-red-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-red-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-red-50/60 p-3 rounded border border-red-200 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">कुल करयोग्य मूल्य (Taxable):</span>
            <span className="font-mono">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>कुल जीएसटी (Total GST):</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800 font-semibold">
              <span>पुराना सोना कटौति (Old Gold):</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-red-800 pt-1 text-sm font-bold text-red-950 font-serif">
            <span>शुद्ध देय राशि (Net Payable):</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-red-300 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
