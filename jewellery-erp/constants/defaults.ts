import { CategoryId, GoldItem, SilverItem, GroceryItem, GeneralItem } from "@/types/category.types";
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

export const DEFAULT_SILVER_SELLER_PROFILE: SellerProfile = {
  legalName: "Shree Silver Art & Utensil Mart Pvt Ltd",
  tradeName: "Shree Silver Art Emporium",
  gstin: "27AABCS8842P1Z8",
  pan: "AABCS8842P",
  address: {
    street: "45 Silver Bazaar, Kalbadevi",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400002",
    country: "India",
  },
  phone: "+91 98201 54321",
  email: "sales@shreesilverart.com",
  website: "www.shreesilverart.com",
  signatureText: "For Shree Silver Art Emporium\nAuthorized Signatory",
  bankDetails: {
    bankName: "HDFC Bank Ltd",
    accountHolderName: "Shree Silver Art & Utensil Mart Pvt Ltd",
    accountNumber: "50200088991122",
    ifscCode: "HDFC0000123",
    branchName: "Kalbadevi Branch",
  },
  upiId: "shreesilver@hdfcbank",
  compositionScheme: false,
};

export const DEFAULT_GROCERY_SELLER_PROFILE: SellerProfile = {
  legalName: "Shree Ganesh Supermarket & Kirana Store",
  tradeName: "Shree Ganesh Supermarket & Kirana",
  gstin: "27AABCG4412M1Z2",
  pan: "AABCG4412M",
  address: {
    street: "Shop 12-14, Laxmi Market, Station Road, Dadar West",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400028",
    country: "India",
  },
  phone: "+91 98333 77889",
  email: "order@shreeganeshkirana.com",
  website: "www.shreeganeshkirana.com",
  signatureText: "For Shree Ganesh Supermarket & Kirana\nAuthorized Signatory",
  bankDetails: {
    bankName: "State Bank of India",
    accountHolderName: "Shree Ganesh Supermarket & Kirana Store",
    accountNumber: "302100456789",
    ifscCode: "SBIN0001234",
    branchName: "Dadar West Branch",
  },
  upiId: "ganeshkirana@sbi",
  compositionScheme: false,
};

export const DEFAULT_GENERAL_SELLER_PROFILE: SellerProfile = {
  legalName: "Apex Technologies & General Trading Pvt Ltd",
  tradeName: "Apex Solutions & Trading",
  gstin: "27AABCA1299K1Z4",
  pan: "AABCA1299K",
  address: {
    street: "Unit 304, Techno IT Park, MIDC Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400093",
    country: "India",
  },
  phone: "+91 98210 99881",
  email: "invoicing@apextechindia.com",
  website: "www.apextechindia.com",
  signatureText: "For Apex Technologies & General Trading Pvt Ltd\nAuthorized Signatory",
  bankDetails: {
    bankName: "ICICI Bank Ltd",
    accountHolderName: "Apex Technologies & General Trading Pvt Ltd",
    accountNumber: "001105023456",
    ifscCode: "ICIC0000011",
    branchName: "MIDC Andheri Branch",
  },
  upiId: "apextech@icici",
  compositionScheme: false,
};

export const DEFAULT_SELLER_PROFILE: SellerProfile = DEFAULT_GOLD_SELLER_PROFILE;

export function getSampleSellerProfileByCategory(category: CategoryId): SellerProfile {
  switch (category) {
    case "gold":
      return { ...DEFAULT_GOLD_SELLER_PROFILE };
    case "silver":
      return { ...DEFAULT_SILVER_SELLER_PROFILE };
    case "grocery":
      return { ...DEFAULT_GROCERY_SELLER_PROFILE };
    case "general":
      return { ...DEFAULT_GENERAL_SELLER_PROFILE };
  }
}

export function getSampleTermsByCategory(category: CategoryId): string[] {
  switch (category) {
    case "gold":
      return [
        "1. Gold purity is hallmarked and certified as per BIS standard.",
        "2. Making charges are subject to 5% GST as per statutory guidelines.",
        "3. Disputes, if any, are subject to Mumbai jurisdiction only.",
      ];
    case "silver":
      return [
        "1. Silver fineness certified as per standard purity grades.",
        "2. Filigree articles are billed under statutory GST concession rate.",
        "3. Goods once sold will not be returned without original cash memo.",
      ];
    case "grocery":
      return [
        "1. Fresh groceries & dairy items must be checked at the time of delivery.",
        "2. Loose unbranded commodities are exempt from GST under Indian law.",
        "3. Thank you for shopping with us! Visit again.",
      ];
    case "general":
      return [
        "1. Warranty as per manufacturer terms and conditions.",
        "2. Payment is due within 15 days of invoice date.",
        "3. Goods once sold will not be accepted back without prior RMA.",
      ];
  }
}

export const DEFAULT_BUYER_DETAILS: BuyerDetails = {
  name: "Ramesh Sharma",
  tradeName: "Sharma Enterprises",
  gstin: "27AAAPL1234C1ZV",
  pan: "AAAPL1234C",
  address: {
    street: "Flat 402, Lotus Heights, Linking Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    stateCode: "27",
    pincode: "400050",
    country: "India",
  },
  placeOfSupply: "Maharashtra",
  placeOfSupplyCode: "27",
  phone: "+91 98199 87654",
  email: "ramesh.sharma@example.com",
};

export const DEFAULT_INVOICE_METADATA: InvoiceMetadata = {
  invoiceNumber: "INV-2026-001",
  invoiceDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
  invoiceType: "tax_invoice",
  reverseCharge: false,
  poNumber: "PO-8842",
  notes: "Thank you for your business! Goods once sold will not be taken back without original invoice.",
  termsAndConditions: [
    "1. Gold purity is hallmarked and certified as per BIS standard.",
    "2. Making charges are subject to 5% GST as per statutory guidelines.",
    "3. Disputes, if any, are subject to Mumbai jurisdiction only.",
  ],
};

export const DEFAULT_OTHER_DETAILS: InvoiceOtherDetails = {
  discountType: "flat",
  discountValue: 0,
  shippingCharges: 0,
  otherCharges: 0,
  roundOff: true,
  declaration:
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.",
  customFooterNote: "Computer generated invoice. No physical signature required.",
  showUpiQr: true,
  showBankDetails: true,
  showSignature: true,
};

export const DEFAULT_EMPTY_SUMMARY: CalculationSummary = {
  subtotal: 0,
  totalDiscounts: 0,
  taxableAmount: 0,
  isInterState: false,
  cgstTotal: 0,
  sgstTotal: 0,
  utgstTotal: 0,
  igstTotal: 0,
  totalTax: 0,
  totalExchangeDeduction: 0,
  shippingCharges: 0,
  otherCharges: 0,
  roundOffAmount: 0,
  grandTotal: 0,
  amountInWords: "Rupees Zero Only",
  taxBreakdownByHsn: [],
};

export const SAMPLE_GOLD_ITEMS: GoldItem[] = [
  {
    id: "gold-item-1",
    category: "gold",
    name: "22K Traditional Bridal Gold Necklace (Hallmarked)",
    hsn: "7113",
    description: "Intricate floral craftsmanship with BIS HUID hallmark",
    grossWeight: 28.5,
    netWeight: 28.0,
    purity: "22K (916)",
    ratePer10g: 74500,
    metalValue: 208600, // (28.0 / 10) * 74500
    makingChargeType: "percentage",
    makingChargeValue: 12, // 12%
    makingChargeAmount: 25032,
    metalGstRate: 3,
    makingGstRate: 5,
    huid: "HUID-916-MH8892",
    oldGoldExchange: {
      enabled: true,
      description: "Old 22K Bangle (Exchange Credit)",
      weight: 5.0,
      ratePer10g: 70000,
      totalDeduction: 35000,
    },
    totalTaxable: 233632,
    totalTax: 7509.6,
    lineTotal: 206141.6,
  },
  {
    id: "gold-item-2",
    category: "gold",
    name: "22K Solid Gold Kada / Bangle Pair",
    hsn: "7113",
    description: "Machine-cut polish finish, BIS certified",
    grossWeight: 16.2,
    netWeight: 16.2,
    purity: "22K (916)",
    ratePer10g: 74500,
    metalValue: 120690,
    makingChargeType: "flat",
    makingChargeValue: 8000,
    makingChargeAmount: 8000,
    metalGstRate: 3,
    makingGstRate: 5,
    huid: "HUID-916-KD4412",
    totalTaxable: 128690,
    totalTax: 4020.7,
    lineTotal: 132710.7,
  },
];

export const SAMPLE_SILVER_ITEMS: SilverItem[] = [
  {
    id: "silver-item-1",
    category: "silver",
    name: "925 Pure Silver Antique Pooja Thali Set (6 Pcs)",
    hsn: "7114",
    description: "Thali, Diya, Kalash, Agarbatti stand with fine embossing",
    grossWeight: 450.0,
    netWeight: 450.0,
    purity: "925 (Sterling)",
    ratePer10g: 890,
    metalValue: 40050,
    makingChargeType: "percentage",
    makingChargeValue: 10,
    makingChargeAmount: 4005,
    isFiligree: false,
    metalGstRate: 3,
    makingGstRate: 5,
    hallmarkNo: "SIL-925-MUM-77",
    totalTaxable: 44055,
    totalTax: 1401.75,
    lineTotal: 45456.75,
  },
];

export const SAMPLE_GROCERY_ITEMS: GroceryItem[] = [
  {
    id: "grocery-item-1",
    category: "grocery",
    name: "Fortune Shudh Desi Cow Ghee (Packaged 1L Tin)",
    hsn: "0405",
    description: "100% Pure aromatic cow ghee with verified FSSAI mark",
    isPackaged: true,
    quantity: 2,
    unit: "L",
    ratePerUnit: 640,
    gstRate: 5,
    discountAmount: 40,
    taxableValue: 1240,
    taxAmount: 62,
    lineTotal: 1302,
  },
  {
    id: "grocery-item-2",
    category: "grocery",
    name: "India Gate Basmati Rice Rozzana (Loose Unbranded)",
    hsn: "1006",
    description: "Farm direct long grain aged basmati rice",
    isPackaged: false,
    quantity: 10,
    unit: "kg",
    ratePerUnit: 95,
    gstRate: 0,
    discountAmount: 0,
    taxableValue: 950,
    taxAmount: 0,
    lineTotal: 950,
  },
  {
    id: "grocery-item-3",
    category: "grocery",
    name: "Tata Salt Vacuum Evaporated (Packaged 1kg)",
    hsn: "2501",
    description: "Iodised edible salt",
    isPackaged: true,
    quantity: 3,
    unit: "packet",
    ratePerUnit: 28,
    gstRate: 5,
    discountAmount: 0,
    taxableValue: 84,
    taxAmount: 4.2,
    lineTotal: 88.2,
  },
];

export const SAMPLE_GENERAL_ITEMS: GeneralItem[] = [
  {
    id: "general-item-1",
    category: "general",
    name: "Dell UltraSharp 27-inch 4K USB-C Hub Monitor",
    hsn: "8471",
    description: "IPS Black technology, HDR400, 98% DCI-P3 color gamut",
    quantity: 1,
    unit: "pcs",
    ratePerUnit: 48500,
    gstRate: 18,
    discountPercent: 5,
    discountAmount: 2425,
    taxableValue: 46075,
    taxAmount: 8293.5,
    lineTotal: 54368.5,
  },
  {
    id: "general-item-2",
    category: "general",
    name: "Ergonomic High-Back Executive Mesh Office Chair",
    hsn: "9403",
    description: "Adjustable lumbar support, 3D armrests, breathable mesh",
    quantity: 2,
    unit: "pcs",
    ratePerUnit: 14200,
    gstRate: 18,
    discountPercent: 0,
    discountAmount: 0,
    taxableValue: 28400,
    taxAmount: 5112,
    lineTotal: 33512,
  },
];

export function getSampleItemsByCategory(category: CategoryId) {
  switch (category) {
    case "gold":
      return [...SAMPLE_GOLD_ITEMS];
    case "silver":
      return [...SAMPLE_SILVER_ITEMS];
    case "grocery":
      return [...SAMPLE_GROCERY_ITEMS];
    case "general":
      return [...SAMPLE_GENERAL_ITEMS];
  }
}

export function createInitialInvoice(category: CategoryId = "gold"): InvoiceData {
  return {
    id: `inv-${Date.now()}`,
    category,
    billingMode: "gst",
    templateId:
      category === "gold"
        ? "gold-classic-jewellers"
        : category === "silver"
        ? "silver-silverline-classic"
        : category === "grocery"
        ? "grocery-kirana-classic"
        : "general-corporate-clean",
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
