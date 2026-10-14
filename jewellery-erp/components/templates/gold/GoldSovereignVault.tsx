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
import { Lock } from "lucide-react";

export function GoldSovereignVault({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-mono p-6 rounded shadow-sm border-2 border-stone-800 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-stone-800 bg-stone-900 text-amber-300 px-3 py-1.5 font-sans">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          <span className="text-xs uppercase font-extrabold tracking-widest">Sovereign Vault &amp; Bullion Depository</span>
        </div>
        <span className="text-[11px] font-mono text-stone-300">Vault Receipt &amp; Tax Invoice</span>
      </div>

      <TemplateHeader invoice={invoice} className="border-stone-300 font-sans" />
      <BuyerDetailsBlock invoice={invoice} className="border-stone-300 my-2 font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-stone-300">
          <thead>
            <tr className="bg-stone-100 font-bold border-b border-stone-300 font-sans">
              <th className="p-2 border-r border-stone-300 text-center w-8">#</th>
              <th className="p-2 border-r border-stone-300">Vault Item / Seal No.</th>
              <th className="p-2 border-r border-stone-300 text-center">Purity</th>
              <th className="p-2 border-r border-stone-300 text-right">Gross Wt</th>
              <th className="p-2 border-r border-stone-300 text-right">Net Gold</th>
              <th className="p-2 border-r border-stone-300 text-right">Fixing Rate</th>
              <th className="p-2 border-r border-stone-300 text-right">Custody/Prem</th>
              {isGst && <th className="p-2 border-r border-stone-300 text-right">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-stone-50">
                <td className="p-2 text-center border-r border-stone-300">{idx + 1}</td>
                <td className="p-2 border-r border-stone-300">
                  <div className="font-bold font-sans text-neutral-900">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-stone-600">Seal / Bar: {item.huid}</div>}
                </td>
                <td className="p-2 text-center border-r border-stone-300 font-bold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-stone-300">{formatGrams(item.grossWeight)}</td>
                <td className="p-2 text-right border-r border-stone-300 font-bold">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-stone-300">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-stone-300">{formatCurrency(item.makingChargeAmount)}</td>
                {isGst && <td className="p-2 text-right border-r border-stone-300">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold text-neutral-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
        <div>{isGst && <TaxSummaryTable summary={summary} />}</div>
        <div className="bg-stone-50 p-3 rounded border border-stone-300 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between font-sans">
            <span className="text-neutral-600">Taxable Subtotal:</span>
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
              <span>Less Old Gold Credit:</span>
              <span>-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-stone-800 pt-1 text-sm font-bold font-sans">
            <span>Net Commercial Payable:</span>
            <span className="font-mono text-base">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-300 font-sans">
        <UpiQrBlock upiId={seller.upiId} payeeName={seller.tradeName || seller.legalName} grandTotal={summary.grandTotal} invoiceNumber={invoice.invoice.invoiceNumber} />
        <SignatureBlock invoice={invoice} />
      </div>
    </div>
  );
}
