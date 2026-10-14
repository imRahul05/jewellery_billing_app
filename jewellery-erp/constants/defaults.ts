import { CategoryId, GoldItem } from "@/types/category.types";
import { InvoiceData, SellerProfile, BuyerDetails, InvoiceMetadata, InvoiceOtherDetails, CalculationSummary } from "@/types/invoice.types";

export const DEFAULT_GOLD_SELLER_PROFILE: SellerProfile = {
  legalName: "Shree Krishna Jewellers & Traders Pvt Ltd",
  tradeName: "Shree Krishna Jewellers",
  gstin: "27AABCU9603R1ZM",
  pan: "AABCU9603R",
  address: {
    street: "108 Zaveri Bazaar, MG Road, Kalbadevi",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400002",
    country: "India",
  },
  phone: "+91 98200 12345",
  email: "billing@shreekrishnajewellers.com",
  website: "www.shreekrishnajewellers.com",
  signatureText: "For Shree Krishna Jewellers\nAuthorized Signatory",
  bankDetails: {
    bankName: "HDFC Bank Ltd",
    accountHolderName: "Shree Krishna Jewellers & Traders Pvt Ltd",
    accountNumber: "50200012345678",
    ifscCode: "HDFC0000123",
    branchName: "Zaveri Bazaar Branch",
  },
  upiId: "shreekrishna@hdfcbank",
  compositionScheme: false,
};

export const DEFAULT_BUYER_DETAILS: BuyerDetails = {
  name: "Mrs. Sunita Sharma",
  phone: "+91 98765 43210",
  email: "sunita.sharma@gmail.com",
  address: {
    street: "Flat 402, Sea Breeze Apts, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400050",
    country: "India",
  },
  placeOfSupply: "Maharashtra",
  placeOfSupplyCode: "27",
};

export const DEFAULT_INVOICE_METADATA: InvoiceMetadata = {
  invoiceNumber: "SKJ/2026-27/0842",
  invoiceDate: new Date().toISOString().split("T")[0],
  invoiceType: "tax_invoice",
  reverseCharge: false,
  notes: "Thank you for choosing Shree Krishna Jewellers. All gold ornaments are BIS Hallmarked.",
  termsAndConditions: [
    "1. Goods once sold cannot be returned or exchanged without original invoice and hallmark card.",
    "2. BIS Hallmarking charge of Rs. 45/- per article is included wherever applicable.",
    "3. Gold purity certified as per Bureau of Indian Standards (BIS) specifications.",
    "4. Subject to Mumbai Jurisdiction only.",
  ],
};

export const DEFAULT_OTHER_DETAILS: InvoiceOtherDetails = {
  discountType: "flat",
  discountValue: 0,
  shippingCharges: 0,
  otherCharges: 0,
  roundOff: true,
  declaration: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged. Gold purity certified under Bureau of Indian Standards (BIS) Hallmarking scheme.",
  customFooterNote: "Thank you for choosing Shree Krishna Jewellers. Visit again!",
  showUpiQr: false,
  showBankDetails: true,
  showSignature: true,
};

export const DEFAULT_EMPTY_SUMMARY: CalculationSummary = {
  subtotal: 257375,
  totalDiscounts: 0,
  taxableAmount: 257375,
  isInterState: false,
  cgstTotal: 3860.63,
  sgstTotal: 3860.63,
  utgstTotal: 0,
  igstTotal: 0,
  totalTax: 7721.25,
  totalExchangeDeduction: 45000,
  shippingCharges: 0,
  otherCharges: 0,
  roundOffAmount: 0.75,
  grandTotal: 220097,
  amountInWords: "Two Lakh Twenty Thousand Ninety Seven Rupees Only",
  taxBreakdownByHsn: [
    {
      hsn: "7113",
      taxableAmount: 257375,
      rate: 3,
      cgstAmount: 3860.63,
      sgstAmount: 3860.63,
      igstAmount: 0,
      totalTax: 7721.25,
    },
  ],
};

export const SAMPLE_GOLD_ITEMS: GoldItem[] = [
  {
    id: "item-g1",
    name: "22K Traditional Bridal Necklace Set",
    hsn: "7113",
    description: "Intricate floral craftsmanship with matching jhumkas",
    category: "gold",
    grossWeight: 24.5,
    netWeight: 23.2,
    purity: "22K (916)",
    ratePer10g: 72500,
    metalValue: 168200,
    makingChargeType: "percentage",
    makingChargeValue: 12,
    makingChargeAmount: 20184,
    metalGstRate: 3,
    makingGstRate: 5,
    huid: "HK916724A",
    oldGoldExchange: {
      enabled: true,
      description: "Old 22K Bangle melt exchange",
      weight: 6.8,
      ratePer10g: 66176.47,
      totalDeduction: 45000,
    },
    totalTaxable: 188384,
    totalTax: 5651.52,
    lineTotal: 194035.52,
  },
  {
    id: "item-g2",
    name: "22K Designer Diamond-Cut Bangles (Pair)",
    hsn: "7113",
    description: "Solid round bangles with rhodium laser polish",
    category: "gold",
    grossWeight: 12.35,
    netWeight: 12.3,
    purity: "22K (916)",
    ratePer10g: 72500,
    metalValue: 89175,
    makingChargeType: "flat",
    makingChargeValue: 4500,
    makingChargeAmount: 4500,
    metalGstRate: 3,
    makingGstRate: 5,
    huid: "HK916725B",
    totalTaxable: 93675,
    totalTax: 2810.25,
    lineTotal: 96485.25,
  },
];

export function getSampleSellerProfileByCategory(_category: CategoryId = "gold"): SellerProfile {
  return DEFAULT_GOLD_SELLER_PROFILE;
}

export function getSampleTermsByCategory(_category: CategoryId = "gold"): string[] {
  return DEFAULT_INVOICE_METADATA.termsAndConditions || [];
}

export function getSampleItemsByCategory(_category: CategoryId = "gold"): GoldItem[] {
  return [...SAMPLE_GOLD_ITEMS];
}

export function createInitialInvoice(category: CategoryId = "gold"): InvoiceData {
  return {
    id: `inv-${Date.now()}`,
    category,
    billingMode: "gst",
    templateId: "gold-classic-jewellers",
    seller: getSampleSellerProfileByCategory(category),
    buyer: { ...DEFAULT_BUYER_DETAILS },
    invoice: {
      ...DEFAULT_INVOICE_METADATA,
      termsAndConditions: getSampleTermsByCategory(category),
    },
    items: getSampleItemsByCategory(category),
    other: { ...DEFAULT_OTHER_DETAILS },
    summary: { ...DEFAULT_EMPTY_SUMMARY },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
