import React from "react";
import { InvoiceData } from "@/types/invoice.types";
import { cn } from "@/lib/utils";

interface BuyerDetailsBlockProps {
  invoice: InvoiceData;
  className?: string;
}

export function BuyerDetailsBlock({ invoice, className }: BuyerDetailsBlockProps) {
  const { buyer, billingMode, invoice: meta } = invoice;
  const isGst = billingMode === "gst";

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-neutral-300 text-xs text-neutral-800",
        className
      )}
    >
      {/* Bill To */}
      <div className="space-y-0.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          Bill To (Recipient)
        </p>
        <p className="font-bold text-sm text-neutral-950">{buyer.name || "Walk-in Customer"}</p>
        {buyer.tradeName && <p className="font-medium text-neutral-700">{buyer.tradeName}</p>}
        {buyer.address.street && (
          <p className="text-neutral-600">
            {buyer.address.street}, {buyer.address.city}, {buyer.address.state} - {buyer.address.pincode}
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 text-neutral-700 pt-0.5">
          {buyer.phone && <span>Phone: {buyer.phone}</span>}
          {buyer.email && <span>Email: {buyer.email}</span>}
        </div>
        {isGst && buyer.gstin && (
          <p className="font-semibold text-neutral-900 pt-0.5">
            GSTIN: <span className="font-mono">{buyer.gstin}</span>
          </p>
        )}
      </div>

      {/* Place of Supply & Dispatch Details */}
      <div className="space-y-0.5 sm:text-right">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
          Place of Supply / Details
        </p>
        {isGst && (
          <>
            <p className="font-bold text-neutral-900">
              State: {buyer.placeOfSupply} (Code: {buyer.placeOfSupplyCode})
            </p>
            <p className="text-neutral-600">
              Reverse Charge (RCM):{" "}
              <span className="font-semibold text-neutral-900">
                {meta.reverseCharge ? "YES" : "NO"}
              </span>
            </p>
          </>
        )}
        {meta.poNumber && (
          <p className="text-neutral-700">
            PO Ref: <span className="font-semibold">{meta.poNumber}</span>
            {meta.poDate && <span> ({meta.poDate})</span>}
          </p>
        )}
        {meta.vehicleNumber && (
          <p className="text-neutral-700">
            Vehicle No: <span className="font-mono font-semibold">{meta.vehicleNumber}</span>
          </p>
        )}
        {meta.eWayBillNumber && (
          <p className="text-neutral-700">
            E-Way Bill: <span className="font-mono font-semibold">{meta.eWayBillNumber}</span>
          </p>
        )}
      </div>
    </div>
  );
}
