import { z } from "zod";

// Helper to validate a decimal number (either as string, number, or object)
const decimalCoercible = z.union([
  z.number(),
  z.string(),
  z.object({}).passthrough()
]).transform((val) => {
  return String(val);
}).refine((val) => {
  try {
    return !isNaN(parseFloat(val)) && isFinite(Number(val));
  } catch {
    return false;
  }
}, { message: "Invalid decimal value" });

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const STATE_CODE_REGEX = /^[0-9]{2}$/;

export const LineItemInputSchema = z.object({
  productId: z.string().cuid().optional().nullable(),
  inventoryItemId: z.string().cuid().optional().nullable(),
  hsnCodeId: z.string().cuid().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  materialType: z.enum(["gold", "silver", "platinum", "diamond", "other"]),
  grossWeight: decimalCoercible.refine(val => Number(val) > 0, "Gross weight must be greater than 0"),
  stoneWeight: decimalCoercible.refine(val => Number(val) >= 0, "Stone weight must be at least 0"),
  purity: decimalCoercible.refine(val => Number(val) >= 0 && Number(val) <= 1000, "Purity must be between 0 and 1000"),
  karat: z.number().int().positive().optional().nullable(),
  metalRatePerGram: decimalCoercible.refine(val => Number(val) > 0, "Metal rate must be greater than 0"),
  makingChargeType: z.enum(["PER_GRAM", "PERCENT", "FLAT"]),
  makingChargeValue: decimalCoercible.refine(val => Number(val) >= 0, "Making charge must be at least 0"),
  wastageType: z.enum(["PERCENT_WEIGHT", "GRAMS", "PERCENT_MAKING", "NONE"]),
  wastageValue: decimalCoercible.refine(val => Number(val) >= 0, "Wastage must be at least 0"),
  stoneChargeType: z.enum(["PER_CARAT", "PER_PIECE", "FLAT", "NONE"]),
  stoneCarat: decimalCoercible.default("0"),
  stonePieces: z.number().int().nonnegative().default(0),
  stoneRate: decimalCoercible.default("0"),
  hallmarkCharges: decimalCoercible.default("0"),
  otherCharges: decimalCoercible.default("0"),
  lineDiscountType: z.enum(["AMOUNT", "PERCENT", "NONE"]),
  lineDiscountValue: decimalCoercible.default("0"),
  quantity: z.number().int().positive().default(1),
  gstRatePercent: decimalCoercible.default("3.00"),
}).refine(data => {
  return Number(data.stoneWeight) <= Number(data.grossWeight);
}, {
  message: "Stone weight cannot exceed gross weight",
  path: ["stoneWeight"]
});

export const OldGoldExchangeInputSchema = z.object({
  netWeight: decimalCoercible.refine(val => Number(val) > 0, "Old gold net weight must be greater than 0"),
  purityRate: decimalCoercible.refine(val => Number(val) > 0, "Old gold purity rate must be greater than 0"),
  deductionPercent: decimalCoercible.refine(val => Number(val) >= 0 && Number(val) <= 100, "Deduction percent must be between 0 and 100"),
});

export const InvoiceCreateSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  supplierId: z.string().cuid().optional().nullable(),
  templateId: z.string().cuid().optional().nullable(),
  relatedInvoiceId: z.string().cuid().optional().nullable(),
  invoiceDate: z.string().or(z.date()).transform(val => new Date(val)),
  dueDate: z.string().or(z.date()).optional().nullable().transform(val => val ? new Date(val) : null),
  type: z.enum(["sales", "purchase", "quotation", "estimate", "return", "exchange", "repair"]).default("sales"),
  placeOfSupply: z.string().regex(STATE_CODE_REGEX, "Place of supply must be a 2-digit GST state code"),
  invoiceDiscountType: z.enum(["AMOUNT", "PERCENT", "NONE"]).default("NONE"),
  invoiceDiscountValue: decimalCoercible.default("0"),
  notes: z.string().optional().nullable(),
  lines: z.array(LineItemInputSchema).min(1, "Invoice must contain at least one line item"),
  oldGoldExchange: OldGoldExchangeInputSchema.optional().nullable(),
});

export const PaymentCreateSchema = z.object({
  amount: decimalCoercible.refine(val => Number(val) > 0, "Payment amount must be greater than 0"),
  method: z.enum(["cash", "card", "upi", "bank_transfer", "cheque", "store_credit", "gold_exchange"]),
  referenceNo: z.string().optional().nullable(),
  exchangeMetalWeight: decimalCoercible.optional().nullable(),
  exchangeMetalValue: decimalCoercible.optional().nullable(),
  paidAt: z.string().or(z.date()).optional().default(() => new Date()).transform(val => new Date(val)),
});

export const MetalRateCreateSchema = z.object({
  metalType: z.enum(["gold", "silver", "platinum", "diamond", "other"]),
  purityFineness: decimalCoercible.refine(val => Number(val) > 0 && Number(val) <= 1000, "Purity must be between 0 and 1000").nullable().optional(),
  rateDate: z.string().or(z.date()).transform(val => new Date(val)),
  ratePerGram: decimalCoercible.refine(val => Number(val) > 0, "Rate per gram must be greater than 0"),
  source: z.string().optional().nullable(),
});
