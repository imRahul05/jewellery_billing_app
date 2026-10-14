import { BillingMode, CategoryId, InvoiceType, LineItem } from "./category.types";

export interface Address {
  street: string;
  city: string;
  state: string;
  stateCode: string; // 2-digit GST code e.g. "27" for Maharashtra
  pincode: string;
  country: string;
}

export interface SellerProfile {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  logoBase64?: string;
  signatureBase64?: string;
  signatureText?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;
    accountHolderName?: string;
  };
  upiId?: string;
  lutNumber?: string; // Letter of Undertaking for exporters
  compositionScheme: boolean;
}

export interface BuyerDetails {
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address: Address;
  placeOfSupply: string; // State name
  placeOfSupplyCode: string; // 2-digit GST State code
  phone?: string;
  email?: string;
}

export interface InvoiceMetadata {
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  invoiceType: InvoiceType;
  reverseCharge: boolean; // Is reverse charge applicable (Yes/No)
  poNumber?: string;
  poDate?: string;
  vehicleNumber?: string;
  eWayBillNumber?: string;
  notes?: string;
  termsAndConditions?: string[];
}

export interface TaxItemBreakdown {
  hsn: string;
  taxableAmount: number;
  rate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface CalculationSummary {
  subtotal: number; // Raw item value before discounts & taxes
  totalDiscounts: number; // Item discounts + overall invoice discount
  taxableAmount: number; // Net taxable base
  isInterState: boolean; // True if Seller State != Buyer/Place of Supply State
  cgstTotal: number;
  sgstTotal: number;
  utgstTotal: number;
  igstTotal: number;
  totalTax: number;
  totalExchangeDeduction: number; // For Gold/Silver old metal return
  shippingCharges: number;
  otherCharges: number;
  roundOffAmount: number; // Difference applied for round off (e.g. +0.40 or -0.35)
  grandTotal: number; // Final payable in INR
  amountInWords: string; // Auto-generated Indian format (Rupees ... Only)
  taxBreakdownByHsn: TaxItemBreakdown[];
}

export interface InvoiceOtherDetails {
  discountType: "flat" | "percentage";
  discountValue: number;
  shippingCharges: number;
  otherCharges: number;
  roundOff: boolean;
  declaration: string;
  customFooterNote?: string;
  showUpiQr: boolean;
  showBankDetails: boolean;
  showSignature: boolean;
}

export interface InvoiceData {
  id: string;
  category: CategoryId;
  billingMode: BillingMode;
  templateId: string;
  seller: SellerProfile;
  buyer: BuyerDetails;
  invoice: InvoiceMetadata;
  items: LineItem[];
  other: InvoiceOtherDetails;
  summary: CalculationSummary;
  createdAt: string;
  updatedAt: string;
}
