export type CategoryId = "gold";

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

export type LineItem = GoldItem;
