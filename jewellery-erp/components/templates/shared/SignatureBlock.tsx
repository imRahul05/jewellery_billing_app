import React from "react";
import { InvoiceData } from "@/types/invoice.types";
import { cn } from "@/lib/utils";

interface SignatureBlockProps {
  invoice: InvoiceData;
  className?: string;
}

export function SignatureBlock({ invoice, className }: SignatureBlockProps) {
  const { seller } = invoice;

  return (
    <div
      className={cn(
        "flex flex-col items-end justify-end text-right text-xs text-neutral-800 space-y-1 min-w-[180px]",
        className
      )}
    >
      <p className="font-semibold text-neutral-950">
        For {seller.tradeName || seller.legalName || "Seller"}
      </p>

      {seller.signatureBase64 ? (
        <div className="py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={seller.signatureBase64}
            alt="Authorized Signature"
            className="h-10 w-auto object-contain max-w-[140px]"
          />
        </div>
      ) : (
        <div className="h-10 w-36 border-b border-dashed border-neutral-400" />
      )}

      <p className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
        {seller.signatureText || "Authorized Signatory"}
      </p>
    </div>
  );
}
