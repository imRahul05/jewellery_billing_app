import React from "react";
import { TemplateProps } from "@/types/template.types";
import { SilverItem } from "@/types/category.types";
import { formatCurrency, formatGrams } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function SilverModernMint({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-200 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-700 mb-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
            Precious Metals & Mint Bullion
          </span>
          <h1 className="text-xl font-bold text-slate-900">{seller.tradeName || seller.legalName}</h1>
        </div>
        <div className="text-right text-xs">
          <span className="px-2.5 py-1 bg-slate-800 text-white font-mono font-bold rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-neutral-500 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-slate-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
              <th className="py-2 px-2">Mint Item</th>
              <th className="py-2 px-2 text-center">Fineness</th>
              <th className="py-2 px-2 text-right">Net Wt</th>
              <th className="py-2 px-2 text-right">Rate/10g</th>
              <th className="py-2 px-2 text-right">Metal Val</th>
              <th className="py-2 px-2 text-right">Minting / Making</th>
              <th className="py-2 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {silverItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-2">
                  <div className="font-semibold text-slate-950">{item.name}</div>
                  {item.hallmarkNo && <div className="text-[10px] text-slate-500 font-mono">Assay: {item.hallmarkNo}</div>}
                </td>
                <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">{item.purity}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatGrams(item.netWeight, 2)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="py-2.5 px-2 text-right font-bold font-mono text-slate-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded border border-slate-200">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total Tax (GST):</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Old Silver Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-slate-950 border-t-2 border-slate-700 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-slate-200 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function SilverLedgerPure({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border border-neutral-400 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <TemplateHeader invoice={invoice} className="border-neutral-400" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-300" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-400 border-collapse">
          <thead>
            <tr className="bg-neutral-100 font-bold border-b border-neutral-400">
              <th className="p-1.5 border-r border-neutral-400 text-center w-8">#</th>
              <th className="p-1.5 border-r border-neutral-400">Item Description</th>
              <th className="p-1.5 border-r border-neutral-400 text-center">Purity</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Gross Wt</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Net Wt</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Rate/10g</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Silver Val</th>
              <th className="p-1.5 border-r border-neutral-400 text-right">Making</th>
              <th className="p-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {silverItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-1.5 text-center border-r border-neutral-400 font-mono">{idx + 1}</td>
                <td className="p-1.5 border-r border-neutral-400">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.hallmarkNo && <div className="text-[10px] text-neutral-500 font-mono">Assay: {item.hallmarkNo}</div>}
                </td>
                <td className="p-1.5 text-center border-r border-neutral-400 font-bold">{item.purity}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatGrams(item.grossWeight, 2)}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono font-semibold">{formatGrams(item.netWeight, 2)}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-1.5 text-right border-r border-neutral-400 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
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
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total Tax (GST):</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Old Silver Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-neutral-900 pt-1">
            <span>Grand Total:</span>
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
