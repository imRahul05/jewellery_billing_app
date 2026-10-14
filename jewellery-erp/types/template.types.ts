import { CategoryId } from "./category.types";
import { InvoiceData } from "./invoice.types";

export type PaperSize = "A4" | "A5" | "Thermal-80mm" | "Thermal-58mm";

export interface TemplateMeta {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  paperSize: PaperSize;
  isThermal: boolean;
  themeColor: string;
  badge?: string; // e.g. "Popular", "Luxury", "Standard", "Receipt"
}

export interface TemplateProps {
  invoice: InvoiceData;
  isThumbnail?: boolean;
  className?: string;
  id?: string;
}
