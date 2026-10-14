import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GeneralMinimalMono({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-mono p-6 rounded border-2 border-black max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
        <div>
          <h1 className="text-xl font-bold uppercase">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs">{seller.address.street}, {seller.address.city}</p>
          {isGst && seller.gstin && <p className="text-xs font-bold">GSTIN: {seller.gstin}</p>}
        </div>
        <div className="text-right text-xs">
          <p className="text-sm font-bold">{invoice.invoice.invoiceNumber}</p>
          <p>{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-black font-sans" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-black border-collapse">
          <thead>
            <tr className="border-b-2 border-black font-bold uppercase text-[10px]">
              <th className="p-2 border-r border-black">Item</th>
              <th className="p-2 border-r border-black text-center">Qty</th>
              <th className="p-2 border-r border-black text-right">Rate</th>
              <th className="p-2 border-r border-black text-right">Taxable</th>
              {isGst && <th className="p-2 border-r border-black text-center">GST</th>}
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {generalItems.map((item, idx) => (
              <tr key={idx}>
                <td className="p-2 border-r border-black font-sans font-medium">{item.name}</td>
                <td className="p-2 text-center border-r border-black">{item.quantity} {item.unit}</td>
                <td className="p-2 text-right border-r border-black">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-2 text-right border-r border-black">{formatCurrency(item.taxableValue)}</td>
                {isGst && <td className="p-2 text-center border-r border-black">{item.gstRate}%</td>}
                <td className="p-2 text-right font-bold">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1 text-xs border border-black p-3 font-mono">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span>{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-black pt-1">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-black text-xs font-sans">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}
