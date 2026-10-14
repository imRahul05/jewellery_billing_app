import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GeneralFreelancerSimple({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-100 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-start justify-between pb-6 border-b border-neutral-100">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-neutral-500">{seller.email} • {seller.phone}</p>
          {isGst && seller.gstin && <p className="text-xs font-mono font-semibold text-neutral-700 mt-1">GSTIN: {seller.gstin}</p>}
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-xs text-neutral-400 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-100 py-4" />

      <div className="my-6 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-400 font-medium uppercase text-[10px]">
              <th className="py-2 pr-2">Services Rendered / Milestones</th>
              <th className="py-2 px-2 text-center">Hours / Qty</th>
              <th className="py-2 px-2 text-right">Rate</th>
              <th className="py-2 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/50">
                <td className="py-3 pr-2">
                  <div className="font-medium text-neutral-900">{item.name}</div>
                  {item.description && <div className="text-[10px] text-neutral-400">{item.description}</div>}
                </td>
                <td className="py-3 px-2 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="py-3 pl-2 text-right font-semibold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
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

        <div className="space-y-2 text-xs bg-neutral-50 p-4 rounded-lg border border-neutral-100">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span className="font-mono text-neutral-900 font-medium">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-500">
              <span>GST ({summary.isInterState ? "IGST" : "CGST+SGST"})</span>
              <span className="font-mono text-neutral-900 font-medium">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-bold text-neutral-950 border-t border-neutral-200 pt-2">
            <span>Total Payable</span>
            <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-400 font-serif italic">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-4 border-t border-neutral-100 text-xs">
        <p className="text-[10px] text-neutral-400 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
