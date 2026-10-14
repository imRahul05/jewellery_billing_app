"use client";

import React from "react";
import { TemplateMeta } from "@/types/template.types";
import { InvoiceData } from "@/types/invoice.types";
import { TemplateRenderer } from "../templates/TemplateRenderer";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateThumbnailProps {
  template: TemplateMeta;
  invoice: InvoiceData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function TemplateThumbnail({
  template,
  invoice,
  isSelected,
  onSelect,
}: TemplateThumbnailProps) {
  // Create preview invoice data with this template id
  const previewInvoice: InvoiceData = {
    ...invoice,
    templateId: template.id,
  };

  return (
    <div
      onClick={() => onSelect(template.id)}
      className={cn(
        "group relative rounded-xl border-2 p-2.5 transition-all cursor-pointer bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-between hover:border-primary hover:shadow-lg hover:shadow-primary/5",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      {/* Top Banner with Name & Badge */}
      <div className="flex items-center justify-between gap-1 mb-2 pb-1 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-200 truncate">{template.name}</span>
        <div className="flex items-center gap-1">
          {template.isThermal && <Badge variant="warning">Thermal</Badge>}
          {template.badge && <Badge variant="default">{template.badge}</Badge>}
        </div>
      </div>

      {/* Miniature Viewport containing live rendered template */}
      <div className="relative w-full h-[220px] overflow-hidden rounded bg-white shadow-inner pointer-events-none select-none border border-neutral-300">
        <div className="origin-top-left transform scale-[0.32] w-[312%] h-[312%] p-2">
          <TemplateRenderer invoice={previewInvoice} isThumbnail={true} />
        </div>
      </div>

      {/* Description & Selection Indicator */}
      <div className="mt-2 pt-1 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="truncate max-w-[80%]">{template.description}</span>
        {isSelected ? (
          <span className="flex items-center gap-1 font-bold text-primary">
            <Check className="h-3.5 w-3.5" /> Selected
          </span>
        ) : (
          <span className="text-neutral-400 group-hover:text-primary transition-colors">Select</span>
        )}
      </div>
    </div>
  );
}
