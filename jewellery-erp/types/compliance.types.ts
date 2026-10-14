import { CategoryId } from "./category.types";

export type ComplianceRuleId =
  | "invoice_type"
  | "invoice_number"
  | "invoice_date"
  | "supplier_name"
  | "supplier_gstin"
  | "supplier_address"
  | "supplier_state"
  | "buyer_name"
  | "place_of_supply"
  | "hsn_on_items"
  | "tax_rate_specified"
  | "reverse_charge_stated"
  | "amount_in_words"
  | "gold_making_charges_split"
  | "gold_purity_huid"
  | "grocery_packaged_status";

export interface ComplianceRule {
  id: ComplianceRuleId;
  title: string;
  description: string;
  applicableCategories?: CategoryId[]; // If empty, applies to all
  gstModeOnly: boolean; // If true, only checked in GST mode
  isMandatory: boolean;
}

export interface ComplianceCheckResult {
  ruleId: ComplianceRuleId;
  title: string;
  description: string;
  passed: boolean;
  message?: string;
}

export interface ComplianceReport {
  passedCount: number;
  totalCount: number;
  scorePercentage: number;
  results: ComplianceCheckResult[];
}
