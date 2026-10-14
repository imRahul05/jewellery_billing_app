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
import { Flame } from "lucide-react";

export function GoldFestiveDiwali({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#fffdf9] text-neutral-900 font-serif p-6 rounded-lg shadow-sm border-2 border-red-700 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-red-700 bg-gradient-to-r from-red-900 via-amber-700 to-red-900 text-amber-200 px-3 py-1.5 rounded font-sans">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-300" />
          <span className="text-xs uppercase font-extrabold tracking-wider">Shubh Dhanteras &amp; Diwali Auspicious Gold</span>
        </div>
        <span className="text-[11px] font-serif text-amber-200">॥ शुभ लाभ • अक्षय लक्ष्मी ॥</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-red-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-red-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-red-300 font-sans">
          <thead>
            <tr className="bg-red-950 text-amber-200 font-semibold border-b border-amber-500">
              <th className="p-2 border-r border-red-800 text-center w-8">#</th>
              <th className="p-2 border-r border-red-800">Shubh Suvarna Article</th>
              <th className="p-2 border-r border-red-800 text-center">Purity</th>
              <th className="p-2 border-r border-red-800 text-right">Net Wt</th>
              <th className="p-2 border-r border-red-800 text-right">Rate/10g</th>
              <th className="p-2 border-r border-red-800 text-right">Gold Val</th>
              <th className="p-2 border-r border-red-800 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-red-800 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-red-50/40">
                <td className="p-2 text-center border-r border-red-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-red-200">
                  <div className="font-bold text-neutral-900 font-serif">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-red-800 font-mono">HUID: {item.huid}</div>}
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
              <span>Old Gold Exchange:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-red-800 pt-1 text-sm font-bold text-red-950 font-serif">
            <span>Net Payable Amount:</span>
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
