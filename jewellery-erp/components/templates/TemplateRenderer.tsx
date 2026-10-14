"use client";

import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GOLD_TEMPLATE_COMPONENTS } from "./gold";
import { GoldClassicJewellers } from "./gold/GoldClassicJewellers";

export function TemplateRenderer({ invoice, isThumbnail = false, className, id }: TemplateProps) {
  const Component = GOLD_TEMPLATE_COMPONENTS[invoice.templateId] || GoldClassicJewellers;

  return (
    <div id={id} className="w-full">
      <Component invoice={invoice} isThumbnail={isThumbnail} className={className} />
    </div>
  );
}
