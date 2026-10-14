import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GoldItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GoldBullionSimple({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border border-neutral-300 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex justify-between items-start pb-4 border-b-2 border-amber-600 mb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-neutral-950">
            {seller.tradeName || seller.legalName}
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            {seller.address.street}, {seller.address.city}, {seller.address.state} - {seller.address.pincode}
          </p>
          <div className="flex gap-3 text-xs text-neutral-600 mt-1">
            {isGst && seller.gstin && <span className="font-mono">GSTIN: {seller.gstin}</span>}
            {seller.phone && <span>Tel: {seller.phone}</span>}
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="inline-block px-3 py-1 bg-amber-500 text-neutral-950 font-bold uppercase tracking-wider rounded">
            {isGst ? "Tax Invoice" : "Retail Bill"}
          </span>
          <p className="mt-1 font-mono font-semibold">Bill No: {invoice.invoice.invoiceNumber}</p>
          <p className="text-neutral-500">Date: {invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
          <thead>
            <tr className="bg-amber-100 text-neutral-950 font-bold border-b border-neutral-300">
              <th className="p-2 border-r border-neutral-300 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-300">Bullion / Coin / Bar</th>
              <th className="p-2 border-r border-neutral-300 text-center">Purity</th>
              <th className="p-2 border-r border-neutral-300 text-right">Net Wt</th>
              <th className="p-2 border-r border-neutral-300 text-right">Rate/10g</th>
              <th className="p-2 border-r border-neutral-300 text-right">Making</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-200 font-medium">
                  {item.name}
                  {item.huid && <span className="block text-[10px] text-amber-700 font-mono">HUID: {item.huid}</span>}
                </td>
                <td className="p-2 text-center border-r border-neutral-200 font-semibold">{item.purity}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.ratePer10g)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
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

        <div className="space-y-1.5 text-xs bg-amber-50/70 p-3 rounded border border-amber-200">
          <div className="flex justify-between">
            <span className="text-neutral-600">Taxable Metal Value:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span className="text-neutral-600">GST (3%):</span>
              <span className="font-mono font-semibold text-amber-700">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold border-t border-amber-300 pt-1 text-neutral-950">
            <span>Net Payable:</span>
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
