import {
  InvoiceData,
  SellerProfile,
  BuyerDetails,
  InvoiceMetadata,
  CalculationSummary,
  InvoiceOtherDetails,
  Address,
  TaxItemBreakdown,
} from "@/types/invoice.types";
import {
  LineItem,
  GoldItem,
  CategoryId,
  InvoiceType,
  GoldPurity,
} from "@/types/category.types";
import { toIndianWords } from "./indian-words";
import { formatAddress, type AddressDetails } from "@/lib/api/business.api";
import type { Prisma } from "@prisma/client";

export interface AdapterLineItemInput {
  id?: string;
  description: string;
  metalType?: string | null;
  purityFineness?: string | number | null;
  karat?: number | null;
  grossWeight?: string | number;
  netWeight?: string | number;
  quantity?: number;
  ratePerGram?: string | number;
  metalValue?: string | number;
  makingCharge?: string | number;
  stoneCharge?: string | number;
  discount?: string | number;
  taxableValue?: string | number;
  cgstAmount?: string | number;
  sgstAmount?: string | number;
  igstAmount?: string | number;
  lineTotal?: string | number;
  hsnCodeId?: string | null;
  hsnCode?: string | null;
}

export interface AdapterPaymentInput {
  id?: string;
  method: string;
  amount: string | number;
  exchangeMetalWeight?: string | number | null;
  exchangeMetalValue?: string | number | null;
  referenceNo?: string | null;
}

export interface AdapterInvoiceInput {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  type?: string;
  status?: string;
  placeOfSupply?: string | null;
  subtotal: string | number;
  makingChargesTotal?: string | number;
  discountTotal?: string | number;
  cgstTotal?: string | number;
  sgstTotal?: string | number;
  igstTotal?: string | number;
  roundOff?: string | number;
  grandTotal: string | number;
  amountPaid?: string | number;
  balanceDue?: string | number;
  notes?: string | null;
  templateId?: string | null;
  lineItems?: AdapterLineItemInput[];
  payments?: AdapterPaymentInput[];
}

export type RawAddressInput =
  | Prisma.JsonValue
  | string
  | (Partial<AddressDetails> & { pincode?: string; stateCode?: string })
  | undefined;

export interface AdapterCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  addressJson?: RawAddressInput;
}

export interface AdapterTenantInput {
  name: string;
  gstin?: string | null;
  address?: string | null;
  addressJson?: RawAddressInput;
  contactPhone?: string | null;
  contactEmail?: string | null;
  pan?: string | null;
  upiId?: string | null;
  logoAssetId?: string | null;
}

function parseAddressObj(addr: RawAddressInput): Address {
  if (!addr) {
    return { street: "", city: "", state: "", stateCode: "", pincode: "", country: "India" };
  }
  if (typeof addr === "string") {
    return { street: addr, city: "", state: "", stateCode: "", pincode: "", country: "India" };
  }
  if (typeof addr === "object" && addr !== null) {
    const a = addr as Partial<AddressDetails> & { pincode?: string; stateCode?: string };
    return {
      street: a.street || "",
      city: a.city || "",
      state: a.state || "",
      stateCode: a.stateCode || "",
      pincode: a.postalCode || a.pincode || "",
      country: a.country || "India",
    };
  }
  return { street: "", city: "", state: "", stateCode: "", pincode: "", country: "India" };
}

function resolveCategoryId(_templateId: string): CategoryId {
  return "gold";
}

function mapInvoiceType(type?: string): InvoiceType {
  if (!type) return "tax_invoice";
  const lower = type.toLowerCase();
  if (lower.includes("purchase")) return "cash_memo";
  if (lower.includes("estimate") || lower.includes("draft")) return "estimate";
  if (lower.includes("proforma")) return "proforma_invoice";
  if (lower.includes("quotation")) return "quotation";
  if (lower.includes("challan")) return "delivery_challan";
  if (lower.includes("supply")) return "bill_of_supply";
  return "tax_invoice";
}

function mapPurityToGold(val?: string | number | null, karat?: number | null): GoldPurity {
  if (val !== undefined && val !== null) {
    const str = String(val).trim();
    if (str.includes("24") || str.includes("999")) return "24K (999)";
    if (str.includes("22") || str.includes("916")) return "22K (916)";
    if (str.includes("18") || str.includes("750")) return "18K (750)";
    if (str.includes("14") || str.includes("585")) return "14K (585)";
  }
  if (karat === 24) return "24K (999)";
  if (karat === 22) return "22K (916)";
  if (karat === 18) return "18K (750)";
  if (karat === 14) return "14K (585)";
  return "22K (916)";
}

/**
 * Adapter converting ERP invoice shapes into the universal 40-template InvoiceData format.
 */
export function adaptInvoiceToTemplateData(
  invoice: AdapterInvoiceInput,
  customer?: AdapterCustomerInput | null,
  tenant?: AdapterTenantInput | null,
  templateOverride?: string | null
): InvoiceData {
  const chosenTemplateId =
    templateOverride ||
    (invoice.templateId ? invoice.templateId.split("_").pop() : null) ||
    "gold-classic-jewellers";

  const category = resolveCategoryId(chosenTemplateId);

  // 1. Seller Profile
  const tenantAddress = tenant?.address || formatAddress(tenant?.addressJson) || "";
  const seller: SellerProfile = {
    legalName: tenant?.name || "Jewellery Retailer",
    tradeName: tenant?.name || "Jewellery Retailer",
    gstin: tenant?.gstin || "",
    pan: tenant?.pan || "",
    address: parseAddressObj(tenant?.addressJson || tenantAddress),
    phone: tenant?.contactPhone || "",
    email: tenant?.contactEmail || "",
    compositionScheme: false,
    upiId: tenant?.upiId || "",
  };

  // 2. Buyer Details
  const customerAddress = formatAddress(customer?.addressJson) || "";
  const buyer: BuyerDetails = {
    name: customer?.name || "Walk-in Customer",
    phone: customer?.phone || "",
    email: customer?.email || "",
    gstin: customer?.gstin || "",
    address: parseAddressObj(customer?.addressJson || customerAddress),
    placeOfSupply: invoice.placeOfSupply ? `State Code: ${invoice.placeOfSupply}` : "Local",
    placeOfSupplyCode: invoice.placeOfSupply || "27",
  };

  // 3. Invoice Metadata
  const invoiceMeta: InvoiceMetadata = {
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: invoice.dueDate ? invoice.dueDate.split("T")[0] : undefined,
    invoiceType: mapInvoiceType(invoice.type),
    reverseCharge: false,
    notes: invoice.notes || undefined,
    termsAndConditions: [
      "Goods once sold cannot be returned without original cash memo.",
      "BIS Hallmarked gold and silver items are guaranteed for certified purity.",
      "Subject to local jurisdiction only.",
    ],
  };

  // 4. Line Items Mapping
  const goldExchangePayments = invoice.payments?.filter((p) => p.method === "gold_exchange") || [];
  const totalExchangeDeduction = goldExchangePayments.reduce(
    (acc, p) => acc + Number(p.exchangeMetalValue || p.amount || 0),
    0
  );

  const items: LineItem[] = (invoice.lineItems || []).map((line, idx) => {
    const grossWeight = Number(line.grossWeight || line.netWeight || 0);
    const netWeight = Number(line.netWeight || line.grossWeight || 0);
    const ratePerGram = Number(line.ratePerGram || 0);
    const metalValue = Number(line.metalValue || ratePerGram * netWeight);
    const makingCharge = Number(line.makingCharge || 0);
    const taxableValue = Number(line.taxableValue || metalValue + makingCharge);
    const totalTax =
      Number(line.cgstAmount || 0) + Number(line.sgstAmount || 0) + Number(line.igstAmount || 0);
    const lineTotal = Number(line.lineTotal || taxableValue + totalTax);
    const hsn = line.hsnCode || line.hsnCodeId || "7113";



    // Default Gold Item
    const firstExchange = idx === 0 && goldExchangePayments.length > 0 ? goldExchangePayments[0] : null;
    const goldItem: GoldItem = {
      id: line.id || `item-${idx}`,
      category: "gold",
      name: line.description,
      hsn,
      grossWeight,
      netWeight,
      purity: mapPurityToGold(line.purityFineness, line.karat),
      ratePer10g: ratePerGram * 10,
      metalValue,
      makingChargeType: "flat",
      makingChargeValue: makingCharge,
      makingChargeAmount: makingCharge,
      metalGstRate: 3,
      makingGstRate: 5,
      oldGoldExchange: firstExchange
        ? {
            enabled: true,
            description: "Old Gold Credit",
            weight: Number(firstExchange.exchangeMetalWeight || 0),
            ratePer10g: 0,
            totalDeduction: Number(firstExchange.exchangeMetalValue || firstExchange.amount || 0),
          }
        : undefined,
      totalTaxable: taxableValue,
      totalTax,
      lineTotal,
    };
    return goldItem;
  });

  // 5. Calculation Summary
  const subtotal = Number(invoice.subtotal || 0);
  const totalDiscounts = Number(invoice.discountTotal || 0);
  const taxableAmount = subtotal - totalDiscounts;
  const cgstTotal = Number(invoice.cgstTotal || 0);
  const sgstTotal = Number(invoice.sgstTotal || 0);
  const igstTotal = Number(invoice.igstTotal || 0);
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const roundOffAmount = Number(invoice.roundOff || 0);
  const grandTotal = Number(invoice.grandTotal || 0);

  // Group Tax by HSN
  const hsnMap = new Map<string, TaxItemBreakdown>();
  for (const line of invoice.lineItems || []) {
    const hsn = line.hsnCode || line.hsnCodeId || "7113";
    const existing = hsnMap.get(hsn) || {
      hsn,
      taxableAmount: 0,
      rate: 3,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
    };
    existing.taxableAmount += Number(line.taxableValue || 0);
    existing.cgstAmount += Number(line.cgstAmount || 0);
    existing.sgstAmount += Number(line.sgstAmount || 0);
    existing.igstAmount += Number(line.igstAmount || 0);
    existing.totalTax += Number(line.cgstAmount || 0) + Number(line.sgstAmount || 0) + Number(line.igstAmount || 0);
    hsnMap.set(hsn, existing);
  }

  const summary: CalculationSummary = {
    subtotal,
    totalDiscounts,
    taxableAmount,
    isInterState: igstTotal > 0,
    cgstTotal,
    sgstTotal,
    utgstTotal: 0,
    igstTotal,
    totalTax,
    totalExchangeDeduction,
    shippingCharges: 0,
    otherCharges: 0,
    roundOffAmount,
    grandTotal,
    amountInWords: toIndianWords(grandTotal),
    taxBreakdownByHsn: Array.from(hsnMap.values()),
  };

  // 6. Other Details
  const other: InvoiceOtherDetails = {
    discountType: "flat",
    discountValue: totalDiscounts,
    shippingCharges: 0,
    otherCharges: 0,
    roundOff: roundOffAmount !== 0,
    declaration:
      "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged.",
    showUpiQr: false,
    showBankDetails: true,
    showSignature: true,
  };

  return {
    id: invoice.invoiceNumber,
    category,
    billingMode: "gst",
    templateId: chosenTemplateId,
    seller,
    buyer,
    invoice: invoiceMeta,
    items,
    other,
    summary,
    createdAt: invoice.invoiceDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
