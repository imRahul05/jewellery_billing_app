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

export function SilverlineClassic({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-slate-300 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 rounded-t mb-3" />
      <TemplateHeader invoice={invoice} className="border-slate-300" />
      <BuyerDetailsBlock invoice={invoice} className="border-slate-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
              <th className="p-2 border-r border-slate-200">Silver Article</th>
              {isGst && <th className="p-2 border-r border-slate-200 text-center w-14">HSN</th>}
              <th className="p-2 border-r border-slate-200 text-center">Purity</th>
              <th className="p-2 border-r border-slate-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-slate-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-slate-200 text-right">Metal Val</th>
              <th className="p-2 border-r border-slate-200 text-right">Making</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {silverItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.hallmarkNo && <div className="text-[10px] text-slate-500 font-mono">Mark: {item.hallmarkNo}</div>}
                  {item.isFiligree && <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">Filigree (1.5% GST)</span>}
                  {item.oldSilverExchange?.enabled && (
                    <div className="text-[10px] text-emerald-700">
                      Ex: -{formatCurrency(item.oldSilverExchange.totalDeduction)}
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-slate-200 font-mono">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-700">{item.purity}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatGrams(item.netWeight, 2)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
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

        <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded border border-slate-300">
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
          <div className="flex justify-between items-center text-sm font-bold text-slate-950 border-t-2 border-slate-400 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-slate-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function SilverFiligreeFrame({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const silverItems = items as SilverItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border-2 border-dashed border-slate-400 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="text-center pb-2 mb-2 border-b border-slate-300">
        <span className="text-xs font-serif font-bold text-slate-700 tracking-widest uppercase">
          ❖ Cuttack & Karimnagar Silver Filigree Artisan Guild ❖
        </span>
      </div>
      <TemplateHeader invoice={invoice} className="border-slate-300" />
      <BuyerDetailsBlock invoice={invoice} className="border-slate-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
              <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
              <th className="p-2 border-r border-slate-200">Filigree Artifact / Jewelry</th>
              <th className="p-2 border-r border-slate-200 text-center">Fineness</th>
              <th className="p-2 border-r border-slate-200 text-right">Net Wt</th>
              <th className="p-2 border-r border-slate-200 text-right">Rate/10g</th>
              <th className="p-2 border-r border-slate-200 text-right">Metal Val</th>
              <th className="p-2 border-r border-slate-200 text-right">Artisan Crafting</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {silverItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60">
                <td className="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  <div className="text-[10px] text-slate-600 font-serif">HSN 7113 11 10 • Handcrafted Fine Wire</div>
                </td>
                <td className="p-2 text-center border-r border-slate-200 font-bold">{item.purity}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatGrams(item.netWeight, 2)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.ratePer10g, { decimals: 0 })}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.metalValue)}</td>
                <td className="p-2 text-right border-r border-slate-200 font-mono">{formatCurrency(item.makingChargeAmount)}</td>
                <td className="p-2 text-right font-bold font-mono">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-slate-50 p-3.5 rounded border border-slate-300">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between text-slate-700">
              <span>Filigree GST (1.5% Special):</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-slate-950 border-t-2 border-slate-400 pt-1.5">
            <span>Grand Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-slate-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
