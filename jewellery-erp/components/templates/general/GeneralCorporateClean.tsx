import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GeneralItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { TemplateHeader } from "../shared/TemplateHeader";
import { BuyerDetailsBlock } from "../shared/BuyerDetailsBlock";
import { TaxSummaryTable } from "../shared/TaxSummaryTable";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { SignatureBlock } from "../shared/SignatureBlock";
import { cn } from "@/lib/utils";

export function GeneralCorporateClean({ invoice, isThumbnail = false, className }: TemplateProps) {
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
      <div className="h-1.5 bg-blue-600 rounded-t mb-3" />
      <TemplateHeader invoice={invoice} className="border-neutral-200" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-neutral-900 font-bold border-b border-neutral-200">
              <th className="p-2 border-r border-neutral-200 text-center w-8">#</th>
              <th className="p-2 border-r border-neutral-200">Item Description</th>
              {isGst && <th className="p-2 border-r border-neutral-200 text-center w-16">HSN/SAC</th>}
              <th className="p-2 border-r border-neutral-200 text-center">Qty / Unit</th>
              <th className="p-2 border-r border-neutral-200 text-right">Unit Rate</th>
              <th className="p-2 border-r border-neutral-200 text-right">Taxable Val</th>
              {isGst && <th className="p-2 border-r border-neutral-200 text-center">GST%</th>}
              <th className="p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50/50">
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-neutral-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.description && <div className="text-[10px] text-neutral-500">{item.description}</div>}
                  {item.discountAmount > 0 && (
                    <div className="text-[10px] text-emerald-700">
                      Discount: -{formatCurrency(item.discountAmount)} ({item.discountPercent}%)
                    </div>
                  )}
                </td>
                {isGst && <td className="p-2 text-center border-r border-neutral-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-neutral-200 font-medium">
                  {item.quantity} {item.unit}
                </td>
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
          {other.showBankDetails && seller.bankDetails && seller.bankDetails.accountNumber && (
            <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded text-xs space-y-0.5 mt-2">
              <p className="font-bold text-[11px] uppercase text-neutral-700">Bank Details for Wire Transfer</p>
              <p className="text-neutral-600">Bank: <strong className="text-neutral-900">{seller.bankDetails.bankName}</strong></p>
              <p className="text-neutral-600">A/C No: <strong className="font-mono text-neutral-900">{seller.bankDetails.accountNumber}</strong></p>
              <p className="text-neutral-600">IFSC: <strong className="font-mono text-neutral-900">{seller.bankDetails.ifscCode}</strong></p>
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-xs bg-neutral-50 p-3.5 rounded border border-neutral-200">
          <div className="flex justify-between text-neutral-700">
            <span>Taxable Amount:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Discount:</span>
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
          {summary.shippingCharges > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>Freight / Shipping:</span>
              <span className="font-mono">+{formatCurrency(summary.shippingCharges)}</span>
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
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-blue-600 pt-1.5">
            <span>Invoice Total:</span>
            <span className="text-base font-mono">{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-serif italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-neutral-200 text-xs">
        <div className="max-w-[60%] space-y-1">
          <p className="text-[10px] text-neutral-600 leading-tight">{other.declaration}</p>
          {other.customFooterNote && <p className="text-[10px] text-neutral-500 italic">{other.customFooterNote}</p>}
        </div>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

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
