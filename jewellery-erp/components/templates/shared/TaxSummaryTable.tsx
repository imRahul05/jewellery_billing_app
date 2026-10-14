import React from "react";
import { CalculationSummary } from "@/types/invoice.types";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

interface TaxSummaryTableProps {
  summary: CalculationSummary;
  className?: string;
}

export function TaxSummaryTable({ summary, className }: TaxSummaryTableProps) {
  if (summary.taxBreakdownByHsn.length === 0) return null;

  const isInterState = summary.isInterState;

  return (
    <div className={cn("text-[11px] text-neutral-900 my-3", className)}>
      <p className="font-bold text-xs uppercase tracking-wider text-neutral-600 mb-1">
        HSN / SAC Tax Breakdown
      </p>
      <div className="overflow-x-auto border border-neutral-300 rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700">
              <th className="p-1.5 font-bold">HSN/SAC</th>
              <th className="p-1.5 font-bold text-right">Taxable Val</th>
              {!isInterState ? (
                <>
                  <th className="p-1.5 font-bold text-right">CGST</th>
                  <th className="p-1.5 font-bold text-right">SGST</th>
                </>
              ) : (
                <th className="p-1.5 font-bold text-right">IGST</th>
              )}
              <th className="p-1.5 font-bold text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {summary.taxBreakdownByHsn.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="p-1.5 font-mono font-medium">{row.hsn}</td>
                <td className="p-1.5 text-right">{formatCurrency(row.taxableAmount)}</td>
                {!isInterState ? (
                  <>
                    <td className="p-1.5 text-right">
                      {formatCurrency(row.cgstAmount)} ({(row.rate / 2).toFixed(1)}%)
                    </td>
                    <td className="p-1.5 text-right">
                      {formatCurrency(row.sgstAmount)} ({(row.rate / 2).toFixed(1)}%)
                    </td>
                  </>
                ) : (
                  <td className="p-1.5 text-right">
                    {formatCurrency(row.igstAmount)} ({row.rate}%)
                  </td>
                )}
                <td className="p-1.5 text-right font-bold">{formatCurrency(row.totalTax)}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-300">
              <td className="p-1.5">Total</td>
              <td className="p-1.5 text-right">{formatCurrency(summary.taxableAmount)}</td>
              {!isInterState ? (
                <>
                  <td className="p-1.5 text-right">{formatCurrency(summary.cgstTotal)}</td>
                  <td className="p-1.5 text-right">{formatCurrency(summary.sgstTotal)}</td>
                </>
              ) : (
                <td className="p-1.5 text-right">{formatCurrency(summary.igstTotal)}</td>
              )}
              <td className="p-1.5 text-right">{formatCurrency(summary.totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
