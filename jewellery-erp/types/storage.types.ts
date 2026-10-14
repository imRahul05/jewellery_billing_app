import { BillingMode, CategoryId } from "./category.types";
import { InvoiceData, SellerProfile } from "./invoice.types";

export interface StoredBillSummary {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  buyerName: string;
  buyerGstin?: string;
  category: CategoryId;
  billingMode: BillingMode;
  templateId: string;
  grandTotal: number;
  totalTax: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBill extends StoredBillSummary {
  fullData: InvoiceData;
}

export interface PresetTemplate {
  id: string;
  name: string;
  category: CategoryId;
  billingMode?: BillingMode;
  templateId?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  data?: Partial<InvoiceData>;
  templateData: InvoiceData;
}

export interface StorageBackup {
  version: string;
  exportedAt: string;
  profile: SellerProfile | null;
  history: StoredBill[];
  presets: PresetTemplate[];
}
