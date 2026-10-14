import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GeneralServicePro({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-200 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-sky-600 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
            Professional Consulting & IT Services
          </span>
          <h1 className="text-xl font-bold text-neutral-900">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-neutral-500">{seller.email} • {seller.phone}</p>
        </div>
        <div className="text-right text-xs">
          <span className="px-2.5 py-1 bg-sky-100 text-sky-900 font-mono font-bold rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-neutral-500 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
          <thead>
            <tr className="bg-sky-50 text-sky-950 font-bold border-b border-sky-200">
              <th className="p-2 border-r border-sky-200">Service Milestone / Deliverable</th>
              {isGst && <th className="p-2 border-r border-sky-200 text-center w-16">SAC</th>}
              <th className="p-2 border-r border-sky-200 text-center">Units</th>
              <th className="p-2 border-r border-sky-200 text-right">Fee Rate</th>
              <th className="p-2 border-r border-sky-200 text-right">Taxable</th>
              {isGst && <th className="p-2 border-r border-sky-200 text-center">GST</th>}
              <th className="p-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 border-r border-sky-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.description && <div className="text-[10px] text-neutral-500">{item.description}</div>}
                </td>
                {isGst && <td className="p-2 text-center border-r border-neutral-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.taxableValue)}</td>
                {isGst && <td className="p-2 text-center border-r border-neutral-200 font-mono">{item.gstRate}%</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-sky-50/40 p-3.5 rounded border border-sky-200">
          <div className="flex justify-between">
            <span>Service Total:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-sky-950 border-t-2 border-sky-400 pt-1.5">
            <span>Total Payable:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-neutral-200 text-xs">
        <p className="text-[10px] text-neutral-500 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
