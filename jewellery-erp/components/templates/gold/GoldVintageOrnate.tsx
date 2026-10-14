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

export function GoldVintageOrnate({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-[#faf8f5] text-[#2c2416] font-serif p-6 rounded-lg border-4 border-double border-[#8b6f3c] max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="text-center pb-2 mb-2 border-b border-[#8b6f3c]/40 text-xs tracking-widest text-[#8b6f3c] uppercase">
        ❖ Traditional Goldsmith & Bullion Merchant Since Inception ❖
      </div>

      <TemplateHeader invoice={invoice} className="border-[#8b6f3c]/50" />
      <BuyerDetailsBlock invoice={invoice} className="border-[#8b6f3c]/30" />

      {/* Ornate Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-[#8b6f3c]/40 border-collapse">
          <thead>
            <tr className="bg-[#f0e9dc] text-[#3d2e16] font-bold border-b border-[#8b6f3c]/40">
              <th className="p-2 border-r border-[#8b6f3c]/30 text-center w-8">No.</th>
              <th className="p-2 border-r border-[#8b6f3c]/30">Particulars</th>
              <th className="p-2 border-r border-[#8b6f3c]/30 text-center">Purity</th>
              <th className="p-2 border-r border-[#8b6f3c]/30 text-right">Net Wt</th>
              <th className="p-2 border-r border-[#8b6f3c]/30 text-right">Rate / 10g</th>
              <th className="p-2 border-r border-[#8b6f3c]/30 text-right">Gold Amt</th>
              <th className="p-2 border-r border-[#8b6f3c]/30 text-right">Making</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#8b6f3c]/20">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#f4efe4]">
                <td className="p-2 text-center border-r border-[#8b6f3c]/30 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-[#8b6f3c]/30">
                  <div className="font-bold text-[#2a1d0d]">{item.name}</div>
                  {item.huid && <div className="text-[10px] text-[#8b6f3c] font-mono">HUID: {item.huid}</div>}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-800">
                      Exch: -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                <td className="p-2 text-center border-r border-[#8b6f3c]/30 font-bold">{item.purity}</td>
                <td className="p-2 text-right border-r border-[#8b6f3c]/30 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-[#8b6f3c]/30 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-[#8b6f3c]/30 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-[#8b6f3c]/30 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="p-2 text-right font-bold font-mono text-[#2a1d0d]">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3 font-sans">
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

        <div className="space-y-1 text-xs bg-[#f2ecde] p-3 rounded border border-[#8b6f3c]/40 font-serif">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-bold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-800">
              <span>Old Gold Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-[#2a1d0d] border-t border-[#8b6f3c]/50 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] italic text-[#554324] pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-[#8b6f3c]/40 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function GoldModernBoutique({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-xl shadow-lg border border-neutral-100 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <span className="text-[10px] tracking-[0.2em] font-extrabold uppercase text-amber-600 block">
            Fine Jewelry Studio
          </span>
          <h1 className="text-2xl font-light tracking-wide text-neutral-900">
            {seller.tradeName || seller.legalName}
          </h1>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p className="font-mono font-bold text-sm text-neutral-900">{invoice.invoice.invoiceNumber}</p>
          <p>{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-100 py-4" />

      {/* Boutique Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-400 font-medium uppercase text-[10px] tracking-wider">
              <th className="py-2.5 pr-2">Design & Article</th>
              <th className="py-2.5 px-2 text-center">Purity</th>
              <th className="py-2.5 px-2 text-right">Net Wt</th>
              <th className="py-2.5 px-2 text-right">Rate/10g</th>
              <th className="py-2.5 px-2 text-right">Gold Value</th>
              <th className="py-2.5 px-2 text-right">Crafting</th>
              <th className="py-2.5 pl-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/50">
                <td className="py-3 pr-2">
                  <span className="font-medium text-neutral-900 block">{item.name}</span>
                  {item.huid && <span className="text-[10px] text-neutral-400 font-mono">HUID: {item.huid}</span>}
                  {item.oldGoldExchange?.enabled && (
                    <span className="text-[10px] text-emerald-600 block">
                      Exchange: -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </span>
                  )}
                </td>
                <td className="py-3 px-2 text-center font-semibold text-amber-700">{item.purity}</td>
                <td className="py-3 px-2 text-right font-mono">{formatGrams(item.netWeight)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="py-3 px-2 text-right font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="py-3 pl-2 text-right font-semibold font-mono text-neutral-900">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
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

        <div className="space-y-2 text-xs bg-neutral-50 p-4 rounded-xl border border-neutral-100">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span className="font-mono text-neutral-900 font-medium">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-neutral-500">
              <span>Tax (GST)</span>
              <span className="font-mono text-neutral-900 font-medium">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Old Gold Credit</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-light text-neutral-950 border-t border-neutral-200 pt-2">
            <span>Total Payable</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.grandTotal)}</span>
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
