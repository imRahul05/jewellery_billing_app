"use client";

import React from "react";
import { TemplateProps } from "@/types/template.types";
import { GOLD_TEMPLATE_COMPONENTS } from "./gold";
import { SILVER_TEMPLATE_COMPONENTS } from "./silver";
import { GROCERY_TEMPLATE_COMPONENTS } from "./grocery";
import { GENERAL_TEMPLATE_COMPONENTS } from "./general";
import { GoldClassicJewellers } from "./gold/GoldClassicJewellers";

const ALL_TEMPLATES_REGISTRY: Record<string, React.ComponentType<TemplateProps>> = {
  ...GOLD_TEMPLATE_COMPONENTS,
  ...SILVER_TEMPLATE_COMPONENTS,
  ...GROCERY_TEMPLATE_COMPONENTS,
  ...GENERAL_TEMPLATE_COMPONENTS,
};

export function TemplateRenderer({ invoice, isThumbnail = false, className, id }: TemplateProps) {
  const Component = ALL_TEMPLATES_REGISTRY[invoice.templateId] || GoldClassicJewellers;

  return (
    <div id={id} className="w-full">
      <Component invoice={invoice} isThumbnail={isThumbnail} className={className} />
    </div>
  );
}
