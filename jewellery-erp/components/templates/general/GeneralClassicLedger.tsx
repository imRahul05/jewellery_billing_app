import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GeneralClassicLedger({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded border border-neutral-400 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <TemplateHeader invoice={invoice} className="border-neutral-400" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-300" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-400 border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-neutral-900 font-bold border-b border-neutral-400">
              <th className="p-1.5 border-r border-neutral-400 text-center w-8">#</th>
              <th className="p-1.5 border-r border-neutral-400">Particulars</th>
              {isGst && <th className="p-1.5 border-r border-neutral-400 text-center w-16">HSN/SAC</th>}
              <th className="p-1.5 border-r border-neutral-400 text-center">Qty</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Rate</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Taxable</th>
              {isGst && <th className="p-1.5 border-r border-neutral-400 text-center">GST%</th>}
              <th className="p-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-1.5 text-center border-r border-neutral-400 font-mono">{idx + 1}</td>
                <td className="p-1.5 border-r border-neutral-400 font-semibold">{item.name}</td>
                {isGst && <td className="p-1.5 text-center border-r border-neutral-400 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-1.5 text-center border-r border-neutral-400 font-mono">{item.quantity} {item.unit}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatCurrency(item.taxableValue)}</td>
                {isGst && <td className="p-1.5 text-center border-r border-neutral-400 font-mono">{item.gstRate}%</td>}
                <td className="p-1.5 text-right font-bold font-mono">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1 text-xs border border-neutral-400 p-3 rounded bg-neutral-50">
          <div className="flex justify-between">
            <span>Taxable Total:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total Tax:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-neutral-900 pt-1">
            <span>Total Payable:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-neutral-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
