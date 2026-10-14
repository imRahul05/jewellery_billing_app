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

export function GoldClassicJewellers({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const goldItems = items as GoldItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-amber-200/80 max-w-[850px] mx-auto print:p-0 print:border-none print:shadow-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      {/* Decorative Gold Header Bar */}
      <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-t mb-4 print:mb-2" />

      {/* Header */}
      <TemplateHeader invoice={invoice} className="border-amber-300" />

      {/* Hallmark Trust Badge */}
      <div className="flex items-center justify-between py-1.5 px-3 bg-amber-50/70 border border-amber-200 rounded my-2 text-[11px] text-amber-950">
        <div className="flex items-center gap-1.5 font-semibold">
          <Award className="h-4 w-4 text-amber-700" />
          <span>BIS 100% Hallmarked Jewellery Guarantee</span>
        </div>
        <span className="text-[10px] text-amber-800 font-serif">Purity Certified • HUID Tracked</span>
      </div>

      {/* Buyer Info */}
      <BuyerDetailsBlock invoice={invoice} className="border-amber-200" />

      {/* Gold Line Items Table */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse border border-amber-200">
          <thead>
            <tr className="bg-amber-100/80 text-amber-950 font-bold border-b border-amber-300">
              <th className="p-2 border-r border-amber-200 text-center w-8">#</th>
              <th className="p-2 border-r border-amber-200">Item Description</th>
              {isGst && <th className="p-2 border-r border-amber-200 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-amber-200 text-center">Purity</th>
              <th className="p-2 border-r border-amber-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-amber-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-amber-200 text-right">Metal Val</th>
              <th className="p-2 border-r border-amber-200 text-right">Making</th>
              {isGst && <th className="p-2 border-r border-amber-200 text-right">Tax</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {goldItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-amber-50/40">
                <td className="p-2 text-center border-r border-amber-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-amber-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.huid && (
                    <div className="text-[10px] text-amber-800 font-mono flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> HUID: {item.huid}
                    </div>
                  )}
                  {item.oldGoldExchange?.enabled && (
                    <div className="text-[10px] text-emerald-700 font-medium">
                      Ex: {item.oldGoldExchange.description || "Old Gold"} ({formatGrams(item.oldGoldExchange.weight)}) = -{formatCurrency(item.oldGoldExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-amber-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-amber-200 font-semibold text-amber-900">{item.purity}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatGrams(item.netWeight)}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-amber-200">
                  <span className="font-mono">{formatCurrency(item.makingChargeAmount)}</span>
                  <span className="text-[9px] text-neutral-500 block">
                    ({item.makingChargeType === "percentage" ? `${item.makingChargeValue}%` : "Flat"})
                  </span>
                </td>
                {isGst && <td className="p-2 text-right border-r border-amber-200 font-mono">{formatCurrency(item.totalTax)}</td>}
                <td className="p-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary and Tax Table */}
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

        <div className="space-y-1.5 text-xs bg-amber-50/50 p-3 rounded border border-amber-200">
          <div className="flex justify-between text-neutral-700">
            <span>Subtotal (Metal + Making):</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>

          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount:</span>
              <span className="font-mono">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}

          {isGst && (
            <>
              {summary.isInterState ? (
                <div className="flex justify-between text-neutral-700">
                  <span>IGST Total:</span>
                  <span className="font-mono font-semibold">{formatCurrency(summary.igstTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-neutral-700">
                    <span>CGST Total:</span>
                    <span className="font-mono">{formatCurrency(summary.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>SGST Total:</span>
                    <span className="font-mono">{formatCurrency(summary.sgstTotal)}</span>
                  </div>
                </>
              )}
            </>
          )}

          {summary.totalExchangeDeduction > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium border-t border-amber-200 pt-1">
              <span>Old Gold Exchange Credit:</span>
              <span className="font-mono">-{formatCurrency(summary.totalExchangeDeduction)}</span>
            </div>
          )}

          {summary.roundOffAmount !== 0 && (
            <div className="flex justify-between text-neutral-600 text-[11px]">
              <span>Round-off:</span>
              <span className="font-mono">
                {summary.roundOffAmount > 0 ? `+${formatCurrency(summary.roundOffAmount)}` : formatCurrency(summary.roundOffAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-amber-950 border-t-2 border-amber-300 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <div className="text-[10px] text-neutral-600 font-serif italic pt-1">
            {summary.amountInWords}
          </div>
        </div>
      </div>

      {/* Footer & Signature */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-amber-200 mt-4 text-[11px] text-neutral-600">
        <div className="max-w-[60%] space-y-1">
          <p className="font-bold text-neutral-900">Declaration:</p>
          <p className="text-[10px] leading-tight">{other.declaration}</p>
          {invoice.invoice.termsAndConditions && (
            <div className="text-[9px] text-neutral-500 space-y-0.5 pt-1">
              {invoice.invoice.termsAndConditions.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </div>
          )}
        </div>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
