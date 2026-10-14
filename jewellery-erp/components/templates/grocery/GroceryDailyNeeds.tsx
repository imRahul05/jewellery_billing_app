import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GroceryItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GroceryDailyNeeds({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded-lg shadow-sm border border-neutral-200 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-900 mb-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
            Provision & Daily Needs Store
          </span>
          <h1 className="text-xl font-bold text-neutral-900">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-neutral-500">{seller.address.street}, {seller.address.city}</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-mono font-bold text-sm text-neutral-900">Bill: {invoice.invoice.invoiceNumber}</p>
          <p className="text-neutral-500">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-900 font-bold uppercase text-[10px]">
              <th className="py-2">Daily Essential Item</th>
              <th className="py-2 text-center">Unit/Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Discount</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="py-2">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  <div className="text-[10px] text-neutral-400">
                    {item.isPackaged ? "Packaged (5% GST)" : "Loose Unbranded (0% GST)"}
                  </div>
                </td>
                <td className="py-2 text-center font-mono">{item.quantity} {item.unit}</td>
                <td className="py-2 text-right font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="py-2 text-right font-mono text-emerald-600">
                  {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : "-"}
                </td>
                <td className="py-2 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-neutral-50 p-3.5 rounded border border-neutral-200">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal:</span>
            <span className="font-mono font-medium">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Savings:</span>
              <span className="font-mono">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between text-neutral-600">
              <span>GST Total:</span>
              <span className="font-mono">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-extrabold text-neutral-950 border-t border-neutral-300 pt-1.5">
            <span>Amount Due:</span>
            <span className="font-mono">{formatCurrency(summary.grandTotal)}</span>
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
