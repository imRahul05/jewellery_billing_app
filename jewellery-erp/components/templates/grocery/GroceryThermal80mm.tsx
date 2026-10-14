import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GroceryItem } from "@/types/category.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { UpiQrBlock } from "../shared/UpiQrBlock";
import { cn } from "@/lib/utils";

export function GroceryThermal80mm({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller, buyer } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-black font-mono text-[11px] leading-tight p-4 border border-dashed border-neutral-400 max-w-[320px] mx-auto shadow-sm print:p-0 print:border-none print:shadow-none print:w-[80mm]",
        isThumbnail && "text-[8px] p-2 max-w-[200px]",
        className
      )}
    >
      {/* Store Header */}
      <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-black">
        <h1 className="text-sm font-extrabold uppercase tracking-tight">
          {seller.tradeName || seller.legalName}
        </h1>
        <p className="text-[10px]">{seller.address.street}, {seller.address.city}</p>
        <p className="text-[10px]">Tel: {seller.phone}</p>
        {isGst && seller.gstin && <p className="text-[10px] font-bold">GSTIN: {seller.gstin}</p>}
      </div>

      {/* Bill Meta */}
      <div className="py-1.5 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>Bill No: <strong>{invoice.invoice.invoiceNumber}</strong></span>
          <span>Date: {invoice.invoice.invoiceDate}</span>
        </div>
        {buyer.name && (
          <div className="flex justify-between">
            <span>Customer: {buyer.name}</span>
            {buyer.phone && <span>Ph: {buyer.phone}</span>}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-black">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-neutral-300">
            {groceryItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 pr-1">
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[9px] text-neutral-600">
                    {item.isPackaged ? "Pkg(5%)" : "Loose(0%)"}
                    {item.discountAmount > 0 && ` -Disc ₹${item.discountAmount}`}
                  </div>
                </td>
                <td className="py-1 text-center whitespace-nowrap">{item.quantity} {item.unit}</td>
                <td className="py-1 text-right">{formatCurrency(item.ratePerUnit, { includeSymbol: false })}</td>
                <td className="py-1 text-right font-bold">{formatCurrency(item.lineTotal, { includeSymbol: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Item Subtotal:</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
        {summary.totalDiscounts > 0 && (
          <div className="flex justify-between font-bold">
            <span>Savings/Disc:</span>
            <span>-{formatCurrency(summary.totalDiscounts)}</span>
          </div>
        )}
        {isGst && (
          <div className="flex justify-between">
            <span>GST Tax:</span>
            <span>{formatCurrency(summary.totalTax)}</span>
          </div>
        )}
        {summary.roundOffAmount !== 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Round-off:</span>
            <span>{summary.roundOffAmount > 0 ? `+${summary.roundOffAmount}` : summary.roundOffAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-extrabold border-t border-black pt-1">
          <span>NET PAYABLE:</span>
          <span>{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      {/* UPI QR & Footer */}
      <div className="pt-2 text-center space-y-2">
        {other.showUpiQr && seller.upiId && (
          <div className="flex justify-center">
            <UpiQrBlock
              upiId={seller.upiId}
              payeeName={seller.tradeName || seller.legalName}
              grandTotal={summary.grandTotal}
              invoiceNumber={invoice.invoice.invoiceNumber}
              className="max-w-[200px] border-none p-0"
            />
          </div>
        )}
        <p className="text-[9px] uppercase font-bold">{other.customFooterNote || "Thank you! Please visit again."}</p>
        <p className="text-[8px] text-neutral-500">100% Computer Generated Receipt</p>
      </div>
    </div>
  );
}

export function GroceryThermal58mm({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller } = invoice;
  const isGst = billingMode === "gst";
  const groceryItems = items as GroceryItem[];

  return (
    <div
      className={cn(
        "bg-white text-black font-mono text-[9px] leading-tight p-2 border border-dashed border-neutral-400 max-w-[240px] mx-auto shadow-sm print:p-0 print:border-none print:shadow-none print:w-[58mm]",
        isThumbnail && "text-[7px] p-1.5 max-w-[160px]",
        className
      )}
    >
      {/* Store Header */}
      <div className="text-center space-y-0.5 pb-1.5 border-b border-dashed border-black">
        <h1 className="text-xs font-extrabold uppercase">{seller.tradeName || seller.legalName}</h1>
        <p className="text-[8px]">{seller.address.city} • Ph: {seller.phone}</p>
        {isGst && seller.gstin && <p className="text-[8px] font-bold font-mono">GST: {seller.gstin}</p>}
      </div>

      {/* Bill Meta */}
      <div className="py-1 border-b border-dashed border-black text-[8px] flex justify-between">
        <span>#{invoice.invoice.invoiceNumber}</span>
        <span>{invoice.invoice.invoiceDate}</span>
      </div>

      {/* Items */}
      <div className="py-1 border-b border-dashed border-black">
        <table className="w-full text-left text-[8px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="py-0.5">Item</th>
              <th className="py-0.5 text-center">Qty</th>
              <th className="py-0.5 text-right">Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-neutral-300">
            {groceryItems.map((item, idx) => (
              <tr key={idx}>
                <td className="py-0.5 font-semibold pr-0.5">{item.name}</td>
                <td className="py-0.5 text-center whitespace-nowrap">{item.quantity}{item.unit}</td>
                <td className="py-0.5 text-right font-bold font-mono">{formatCurrency(item.lineTotal, { includeSymbol: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="py-1 border-b border-dashed border-black space-y-0.5 text-[9px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>
        {summary.totalDiscounts > 0 && (
          <div className="flex justify-between">
            <span>Disc:</span>
            <span>-{formatCurrency(summary.totalDiscounts)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-[10px] border-t border-black pt-0.5">
          <span>TOTAL:</span>
          <span>{formatCurrency(summary.grandTotal)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-1 text-center space-y-1">
        {other.showUpiQr && seller.upiId && (
          <div className="flex justify-center">
            <UpiQrBlock
              upiId={seller.upiId}
              payeeName={seller.tradeName || seller.legalName}
              grandTotal={summary.grandTotal}
              invoiceNumber={invoice.invoice.invoiceNumber}
              className="max-w-[150px] border-none p-0"
            />
          </div>
        )}
        <p className="text-[8px] uppercase font-bold">Thank You! Visit Again</p>
      </div>
    </div>
  );
}
