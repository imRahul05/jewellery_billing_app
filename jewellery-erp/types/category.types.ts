export type CategoryId = "gold" | "silver" | "grocery" | "general";

export type BillingMode = "gst" | "non_gst";

export type InvoiceType =
  | "tax_invoice"
  | "bill_of_supply"
  | "cash_memo"
  | "proforma_invoice"
  | "quotation"
  | "estimate"
  | "delivery_challan";

export type GoldPurity = "24K (999)" | "22K (916)" | "18K (750)" | "14K (585)" | "Other";

export type SilverPurity = "999 (Fine Silver)" | "925 (Sterling)" | "900 (Coin Silver)" | "800 (Artisan)" | "Other";

export type MakingChargeType = "flat" | "percentage";

export type GroceryUnit = "kg" | "g" | "L" | "ml" | "pcs" | "packet" | "box" | "bag" | "dozen" | "can";

export type GeneralUnit = "pcs" | "box" | "packet" | "kg" | "g" | "meter" | "sq_ft" | "sq_meter" | "liter" | "set" | "hours" | "days" | "month";

export interface BaseItem {
  id: string;
  name: string;
  hsn: string;
  description?: string;
}

export interface GoldItem extends BaseItem {
  category: "gold";
  grossWeight: number; // in grams
  netWeight: number; // in grams (gross - stone/waste)
  purity: GoldPurity;
  ratePer10g: number; // rate per 10 grams in INR
  metalValue: number; // (netWeight / 10) * ratePer10g
  makingChargeType: MakingChargeType;
  makingChargeValue: number; // percentage or flat INR
  makingChargeAmount: number; // resolved INR amount
  metalGstRate: number; // default 3%
  makingGstRate: number; // default 5%
  huid?: string; // Hallmark Unique Identification
  oldGoldExchange?: {
    enabled: boolean;
    description?: string;
    weight: number; // grams
    ratePer10g: number;
    totalDeduction: number;
  };
  totalTaxable: number;
  totalTax: number;
  lineTotal: number;
}

export interface SilverItem extends BaseItem {
  category: "silver";
  grossWeight: number; // in grams
  netWeight: number; // in grams
  purity: SilverPurity;
  ratePer10g: number; // rate per 10 grams in INR
  metalValue: number; // (netWeight / 10) * ratePer10g
  makingChargeType: MakingChargeType;
  makingChargeValue: number;
  makingChargeAmount: number;
  isFiligree: boolean; // if true, special 1.5% GST
  metalGstRate: number; // default 3% (or 1.5% if filigree)
  makingGstRate: number; // default 5%
  hallmarkNo?: string;
  oldSilverExchange?: {
    enabled: boolean;
    description?: string;
    weight: number;
    ratePer10g: number;
    totalDeduction: number;
  };
  totalTaxable: number;
  totalTax: number;
  lineTotal: number;
}

export interface GroceryItem extends BaseItem {
  category: "grocery";
  isPackaged: boolean; // Packaged & Labelled -> 5%, Loose -> 0%
  quantity: number;
  unit: GroceryUnit;
  ratePerUnit: number;
  gstRate: number; // 0%, 5%, 12%, 18%, etc.
  discountAmount: number; // flat discount on item
  taxableValue: number;
  taxAmount: number;
  lineTotal: number;
}

export interface GeneralItem extends BaseItem {
  category: "general";
  quantity: number;
  unit: GeneralUnit;
  ratePerUnit: number;
  gstRate: number; // 0%, 5%, 18%, 40%, or custom
  discountPercent: number;
  discountAmount: number;
  taxableValue: number;
  taxAmount: number;
  lineTotal: number;
}

export type LineItem = GoldItem | SilverItem | GroceryItem | GeneralItem;
