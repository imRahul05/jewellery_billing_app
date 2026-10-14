import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GroceryItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";
import { Leaf } from "lucide-react";

export function GroceryFarmFresh({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-emerald-50/20 text-neutral-900 font-sans p-6 rounded-xl border border-emerald-200 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-600 mb-3">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-emerald-950 uppercase">{seller.tradeName || seller.legalName}</h1>
            <p className="text-xs text-emerald-800">Fresh Produce & Natural Groceries</p>
          </div>
        </div>
        <div className="text-right text-xs text-emerald-900">
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-emerald-200 bg-white/70" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs bg-white border border-emerald-200 rounded overflow-hidden">
          <thead>
            <tr className="bg-emerald-700 text-white font-bold">
              <th className="p-2 border-r border-emerald-600 text-center w-8">#</th>
              <th className="p-2 border-r border-emerald-600">Farm / Grocery Item</th>
              {isGst && <th className="p-2 border-r border-emerald-600 text-center w-16">HSN</th>}
              <th className="p-2 border-r border-emerald-600 text-center">Packaging</th>
              <th className="p-2 border-r border-emerald-600 text-center">Qty</th>
              <th className="p-2 border-r border-emerald-600 text-right">Rate</th>
              {isGst && <th className="p-2 border-r border-emerald-600 text-center">GST%</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {groceryItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/50">
                <td className="p-2 text-center border-r border-emerald-100 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-emerald-100 font-semibold text-emerald-950">{item.name}</td>
                {isGst && <td className="p-2 text-center border-r border-emerald-100 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-emerald-100 text-[11px]">
                  {item.isPackaged ? "Packaged (5%)" : "Fresh/Loose (0%)"}
                </td>
                <td className="p-2 text-center border-r border-emerald-100 font-mono font-medium">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right border-r border-emerald-100 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                {isGst && <td className="p-2 text-center border-r border-emerald-100 font-mono font-semibold text-emerald-700">{item.gstRate}%</td>}
                <td className="p-2 text-right font-bold font-mono text-emerald-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1.5 text-xs bg-white border border-emerald-200 p-3.5 rounded-lg shadow-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Savings / Discount:</span>
              <span className="font-mono font-semibold">-{formatCurrency(summary.totalDiscounts)}</span>
            </div>
          )}
          {isGst && (
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-emerald-950 border-t border-emerald-300 pt-1.5">
            <span>Amount Payable:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-emerald-200 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
