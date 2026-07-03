import { api } from "./http";
import { SerializedInvoice } from "@/app/api/v1/invoices/route";

export interface LineItemInput {
  productId?: string | null;
  inventoryItemId?: string | null;
  hsnCodeId?: string | null;
  description: string;
  materialType: "gold" | "silver" | "platinum" | "diamond" | "other";
  grossWeight: string | number;
  stoneWeight: string | number;
  purity: string | number;
  karat?: number | null;
  metalRatePerGram: string | number;
  makingChargeType: "PER_GRAM" | "PERCENT" | "FLAT";
  makingChargeValue: string | number;
  wastageType: "PERCENT_WEIGHT" | "GRAMS" | "PERCENT_MAKING" | "NONE";
  wastageValue: string | number;
  stoneChargeType: "PER_CARAT" | "PER_PIECE" | "FLAT" | "NONE";
  stoneCarat?: string | number;
  stonePieces?: number;
  stoneRate?: string | number;
  hallmarkCharges?: string | number;
  otherCharges?: string | number;
  lineDiscountType: "AMOUNT" | "PERCENT" | "NONE";
  lineDiscountValue?: string | number;
  quantity?: number;
  gstRatePercent?: string | number;
}

export interface OldGoldExchangeInput {
  netWeight: string | number;
  purityRate: string | number;
  deductionPercent: string | number;
}

export interface InvoiceCreateInput {
  customerId?: string | null;
  supplierId?: string | null;
  templateId?: string | null;
  invoiceDate: string | Date;
  dueDate?: string | Date | null;
  type?: "sales" | "purchase" | "quotation" | "estimate" | "return" | "exchange" | "repair";
  placeOfSupply: string;
  invoiceDiscountType?: "AMOUNT" | "PERCENT" | "NONE";
  invoiceDiscountValue?: string | number;
  notes?: string | null;
  lines: LineItemInput[];
  oldGoldExchange?: OldGoldExchangeInput | null;
}

export interface PaymentCreateInput {
  amount: string | number;
  method: "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "store_credit" | "gold_exchange";
  referenceNo?: string | null;
  exchangeMetalWeight?: string | number | null;
  exchangeMetalValue?: string | number | null;
  paidAt?: string | Date;
}

export interface ReturnInvoiceInput {
  reason: string;
  lines: Array<{
    lineItemId: string;
    quantity: number;
  }>;
}

export const invoiceApi = {
  getInvoices: (params?: { customerId?: string; status?: string; type?: string; limit?: number; offset?: number }) =>
    api.get<SerializedInvoice[]>("/invoices", params),
  getInvoiceById: (id: string) =>
    api.get<SerializedInvoice>(`/invoices/${id}`),
  createInvoice: (data: InvoiceCreateInput) =>
    api.post<SerializedInvoice>("/invoices", data),
  updateInvoice: (id: string, data: InvoiceCreateInput) =>
    api.put<SerializedInvoice>(`/invoices/${id}`, data),
  deleteInvoice: (id: string) =>
    api.delete<void>(`/invoices/${id}`),
  finalizeInvoice: (id: string) =>
    api.post<SerializedInvoice>(`/invoices/${id}/finalize`),
  cancelInvoice: (id: string, reason: string) =>
    api.post<SerializedInvoice>(`/invoices/${id}/cancel`, { reason }),
  createPayment: (id: string, data: PaymentCreateInput) =>
    api.post<{ payment: unknown; invoiceStatus: string; balanceDue: string }>(`/invoices/${id}/payments`, data),
  getInvoicePdfUrl: (id: string) =>
    api.get<{ url: string }>(`/invoices/${id}/pdf`),
  createReturn: (id: string, data: ReturnInvoiceInput) =>
    api.post<SerializedInvoice>(`/invoices/${id}/return`, data),
};
