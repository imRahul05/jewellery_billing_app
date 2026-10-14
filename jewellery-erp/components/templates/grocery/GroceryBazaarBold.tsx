import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GroceryItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GroceryBazaarBold({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border-4 border-neutral-900 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="bg-neutral-900 text-white font-extrabold text-center py-2 text-sm tracking-wider uppercase mb-3">
        ★ {seller.tradeName || seller.legalName} • WHOLESALE & RETAIL GRAIN BAZAAR ★
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-900 border-b-2" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-300" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-2 border-neutral-900 border-collapse">
          <thead>
            <tr className="bg-neutral-900 text-white font-bold">
              <th className="p-2 border-r border-neutral-700 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-700">Item Description</th>
              <th className="p-2 border-r border-neutral-700 text-center">Type</th>
              <th className="p-2 border-r border-neutral-700 text-center">Qty / Bags</th>
              <th className="p-2 border-r border-neutral-700 text-right">Bazaar Rate</th>
              <th className="p-2 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y border-neutral-300">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-100">
                <td className="p-2 text-center border-r border-neutral-300 font-mono font-bold">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-300 font-bold">{item.name}</td>
                <td className="p-2 text-center border-r border-neutral-300 text-[10px] font-semibold">
                  {item.isPackaged ? "Packaged" : "Loose"}
                </td>
                <td className="p-2 text-center border-r border-neutral-300 font-mono font-semibold">
                  {item.quantity} {item.unit}
                </td>
                <td className="p-2 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-2 text-right font-extrabold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-neutral-100 p-3.5 rounded border-2 border-neutral-900 font-mono">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span className="font-bold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>DISCOUNT:</span>
              <span>-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between">
              <span>GST TAX:</span>
              <span className="font-bold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-extrabold text-neutral-950 border-t-2 border-neutral-900 pt-1.5">
            <span>FINAL TOTAL:</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-700 font-sans italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t-2 border-neutral-900 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function GrocerySuperSaver({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg border border-yellow-400 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="bg-yellow-400 text-neutral-950 p-2.5 rounded-t mb-3 flex items-center justify-between font-bold">
        <div className="text-sm uppercase tracking-wide">
          ★ SUPER SAVER MEGA MART BILL ★
        </div>
        <div className="text-xs font-mono">
          Save Big Every Day
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
          <thead>
            <tr className="bg-yellow-50 text-neutral-900 font-bold border-b border-yellow-200">
              <th className="p-2 border-r border-neutral-200">Item</th>
              <th className="p-2 border-r border-neutral-200 text-center">Qty</th>
              <th className="p-2 border-r border-neutral-200 text-right">Price</th>
              <th className="p-2 border-r border-neutral-200 text-right">Savings</th>
              <th className="p-2 text-right">You Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-yellow-50/20">
                <td className="p-2 border-r border-neutral-200 font-semibold">{item.name}</td>
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-2 text-right border-r border-neutral-200 font-mono text-emerald-600 font-medium">
                  {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : "-"}
                </td>
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

        <div className="space-y-1.5 text-xs bg-yellow-50/60 p-3.5 rounded border border-yellow-300">
          <div className="flex justify-between">
            <span>MRP Total:</span>
            <span className="font-mono">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Super Savings:</span>
              <span className="font-mono">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between">
              <span>GST Included:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-yellow-400 pt-1.5">
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
