"use client";

import React, { useEffect, useState } from "react";
import { generateUpiQrDataUrl } from "@/lib/qr/upi-qr";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

interface UpiQrBlockProps {
  upiId?: string;
  payeeName: string;
  grandTotal: number;
  invoiceNumber: string;
  className?: string;
}

export function UpiQrBlock({
  upiId,
  payeeName,
  grandTotal,
  invoiceNumber,
  className,
}: UpiQrBlockProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (upiId) {
      generateUpiQrDataUrl({
        upiId,
        payeeName,
        amount: grandTotal,
        invoiceNumber,
      }).then((url) => {
        if (isMounted) setQrDataUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [upiId, payeeName, grandTotal, invoiceNumber]);

  if (!upiId || !qrDataUrl) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 border border-neutral-300 rounded bg-white text-neutral-900 max-w-[240px]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="UPI Payment QR Code"
        className="h-16 w-16 object-contain border border-neutral-200 p-0.5 rounded"
      />
      <div className="text-[10px] space-y-0.5 leading-tight">
        <p className="font-bold text-neutral-950 uppercase tracking-tight">Scan & Pay via UPI</p>
        <p className="text-neutral-700 font-mono break-all">{upiId}</p>
        <p className="font-bold text-neutral-900">{formatCurrency(grandTotal)}</p>
        <p className="text-[9px] text-neutral-500">GPay, PhonePe, Paytm, BHIM</p>
      </div>
    </div>
  );
}
