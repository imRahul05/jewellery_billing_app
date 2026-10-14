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
import { Truck, FileCheck } from "lucide-react";

export function GeneralTradeInvoice({ invoice, isThumbnail = false, className }: TemplateProps) {
  const { items, summary, other, billingMode, seller, invoice: meta } = invoice;
  const isGst = billingMode === "gst";
  const generalItems = items as GeneralItem[];

  return (
    <div
      className={cn(
        "bg-white text-neutral-900 font-sans p-6 rounded border-2 border-neutral-800 max-w-[850px] mx-auto print:p-0 print:border-none",
        isThumbnail && "text-[9px] p-2",
        className
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-900 mb-3 text-xs font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <Truck className="h-4 w-4" />
          <span>Commercial B2B Trade & Tax Invoice</span>
        </div>
        <div className="flex items-center gap-1">
          <FileCheck className="h-4 w-4" /> Original for Recipient
        </div>
      </div>

      <TemplateHeader invoice={invoice} className="border-neutral-300" />
      <BuyerDetailsBlock invoice={invoice} className="border-neutral-300" />

      {/* Trade Dispatch Details Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-neutral-100 border border-neutral-300 rounded my-2 text-[11px]">
        <div>
          <span className="text-neutral-500 block">Dispatch Mode</span>
          <span className="font-semibold text-neutral-900">Road Transport</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Vehicle No.</span>
          <span className="font-mono font-bold text-neutral-900">{meta.vehicleNumber || "MH-04-AX-9921"}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">E-Way Bill No.</span>
          <span className="font-mono font-bold text-neutral-900">{meta.eWayBillNumber || "2310 9845 2201"}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Terms of Delivery</span>
          <span className="font-semibold text-neutral-900">F.O.R Destination</span>
        </div>
      </div>

      <div className="my-3 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
          <thead>
            <tr className="bg-neutral-800 text-white font-bold">
              <th className="p-1.5 border-r border-neutral-700 text-center w-8">#</th>
              <th className="p-1.5 border-r border-neutral-700">Goods Description</th>
              {isGst && <th className="p-1.5 border-r border-neutral-700 text-center w-16">HSN</th>}
              <th className="p-1.5 border-r border-neutral-700 text-center">Qty</th>
              <th className="p-1.5 border-r border-neutral-700 text-right">Rate</th>
              <th className="p-1.5 border-r border-neutral-700 text-right">Taxable</th>
              {isGst && <th className="p-1.5 border-r border-neutral-700 text-center">GST%</th>}
              <th className="p-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-300">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-1.5 text-center border-r border-neutral-300 font-mono font-bold">{idx + 1}</td>
                <td className="p-1.5 border-r border-neutral-300">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.description && <div className="text-[10px] text-neutral-500">{item.description}</div>}
                </td>
                {isGst && <td className="p-1.5 text-center border-r border-neutral-300 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-1.5 text-center border-r border-neutral-300 font-mono">{item.quantity} {item.unit}</td>
                <td className="p-1.5 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.ratePerUnit)}</td>
                <td className="p-1.5 text-right border-r border-neutral-300 font-mono">{formatCurrency(item.taxableValue)}</td>
                {isGst && <td className="p-1.5 text-center border-r border-neutral-300 font-mono">{item.gstRate}%</td>}
                <td className="p-1.5 text-right font-bold font-mono text-neutral-950">{formatCurrency(item.lineTotal)}</td>
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

        <div className="space-y-1 text-xs border border-neutral-400 p-3 rounded bg-neutral-50 font-mono">
          <div className="flex justify-between">
            <span>Taxable Value:</span>
            <span>{formatCurrency(summary.taxableAmount)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>Total GST:</span>
              <span>{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          {summary.shippingCharges > 0 && (
            <div className="flex justify-between">
              <span>Freight Charges:</span>
              <span>+{formatCurrency(summary.shippingCharges)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-neutral-950 border-t-2 border-neutral-900 pt-1">
            <span>Invoice Grand Total:</span>
            <span>{formatCurrency(summary.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-neutral-600 font-sans italic pt-1">{summary.amountInWords}</p>
        </div>
      </div>

      <div className="flex justify-between items-end pt-3 border-t border-neutral-300 text-xs">
        <p className="text-[10px] text-neutral-600 max-w-[60%]">{other.declaration}</p>
        {other.showSignature && <SignatureBlock invoice={invoice} />}
      </div>
    </div>
  );
}

export function GeneralServicePro({ invoice, isThumbnail = false, className }: TemplateProps) {
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
      <div className="flex items-center justify-between pb-3 border-b-2 border-sky-600 mb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
            Professional Consulting & IT Services
          </span>
          <h1 className="text-xl font-bold text-neutral-900">{seller.tradeName || seller.legalName}</h1>
          <p className="text-xs text-neutral-500">{seller.email} • {seller.phone}</p>
        </div>
        <div className="text-right text-xs">
          <span className="px-2.5 py-1 bg-sky-100 text-sky-900 font-mono font-bold rounded">
            {invoice.invoice.invoiceNumber}
          </span>
          <p className="text-neutral-500 mt-1">{invoice.invoice.invoiceDate}</p>
        </div>
      </div>

      <BuyerDetailsBlock invoice={invoice} className="border-neutral-200" />

      <div className="my-4 overflow-x-auto">
        <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
          <thead>
            <tr className="bg-sky-50 text-sky-950 font-bold border-b border-sky-200">
              <th className="p-2 border-r border-sky-200">Service Milestone / Deliverable</th>
              {isGst && <th className="p-2 border-r border-sky-200 text-center w-16">SAC</th>}
              <th className="p-2 border-r border-sky-200 text-center">Units</th>
              <th className="p-2 border-r border-sky-200 text-right">Fee Rate</th>
              <th className="p-2 border-r border-sky-200 text-right">Taxable</th>
              {isGst && <th className="p-2 border-r border-sky-200 text-center">GST</th>}
              <th className="p-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {generalItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-2 border-r border-neutral-200">
                  <div className="font-semibold text-neutral-950">{item.name}</div>
                  {item.description && <div className="text-[10px] text-neutral-500">{item.description}</div>}
                </td>
                {isGst && <td className="p-2 text-center border-r border-neutral-200 font-mono text-[11px]">{item.hsn}</td>}
                <td className="p-2 text-center border-r border-neutral-200 font-mono">{item.quantity} {item.unit}</td>
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
        </div>

        <div className="space-y-1.5 text-xs bg-sky-50/40 p-3.5 rounded border border-sky-200">
          <div className="flex justify-between">
            <span>Service Total:</span>
            <span className="font-mono font-semibold">{formatCurrency(summary.subtotal)}</span>
          </div>
          {isGst && (
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span className="font-mono font-semibold">{formatCurrency(summary.totalTax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-sky-950 border-t-2 border-sky-400 pt-1.5">
            <span>Total Payable:</span>
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
