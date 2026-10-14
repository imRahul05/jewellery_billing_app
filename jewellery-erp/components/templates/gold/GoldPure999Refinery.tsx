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
import { ShieldCheck, Award } from "lucide-react";

export function GoldPure999Refinery({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-mono p-6 rounded shadow-sm border-2 border-amber-500 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-amber-500 bg-amber-500 text-neutral-950 px-3 py-1.5 rounded-t font-sans">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-xs uppercase font-extrabold tracking-widest">
            999.9 Fine Gold Refinery Assay Certificate &amp; Tax Invoice
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <ShieldCheck className="h-4 w-4" />
          <span>NABL / BIS Certified Refinery</span>
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-amber-200 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-amber-200 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-300">
          <thead>
            <tr className="bg-neutral-900 text-amber-300 font-sans font-semibold">
              <th className="p-2 border-r border-neutral-700 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-700">Bar / Coin Serial Spec</th>
              <th className="p-2 border-r border-neutral-700 text-center">Assayed Purity</th>
              <th className="p-2 border-r border-neutral-700 text-right">Gross Wt</th>
              <th className="p-2 border-r border-neutral-700 text-right">Fine Gold Wt</th>
              <th className="p-2 border-r border-neutral-700 text-right">Refinery Rate</th>
              <th className="p-2 border-r border-neutral-700 text-right">Premium</th>
              {isGst && <th className="p-2 border-r border-neutral-700 text-right">GST</th>}
              <th className="p-2 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/50">
                <td className="p-2 text-center border-r border-amber-300">{idx + 1}</td>
                <td className="p-2 border-r border-amber-300">
                  <div className="font-bold font-sans text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-amber-800">Assay Serial: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-amber-300 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-300">{formatGrams(item.grossWeight)}</td>
                <td className="p-2 text-right border-r border-amber-300 font-bold">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-300">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-300">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-amber-300">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold text-neutral-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-amber-50/70 p-3 rounded border border-amber-300 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between font-sans">
            <span className="text-neutral-600">Taxable Bullion Value:</span>
            <span>{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between font-sans">
              <span className="text-neutral-600">GST (3%):</span>
              <span>{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between font-sans text-emerald-800">
              <span>Less Old Melt Deduction:</span>
              <span>-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-amber-500 pt-1 text-sm font-bold font-sans text-amber-950">
            <span>Net Commercial Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-amber-300 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
