"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCustomers, useCreateCustomer } from "@/lib/query/hooks/use-customers";
import { useInventoryItems } from "@/lib/query/hooks/use-inventory-items";
import { useMetalRates } from "@/lib/query/hooks/use-metal-rates";
import { useCreateInvoice, useFinalizeInvoice } from "@/lib/query/hooks/use-invoices";
import { useBusinessSettings } from "@/lib/query/hooks/use-business-settings";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { InvoiceCreateInput, LineItemInput, OldGoldExchangeInput, InitialPaymentInput } from "@/lib/api/invoices.api";
import { formatAddress } from "@/lib/api/business.api";
import { calculateInvoice } from "@/lib/billing/calculator";
import { InvoicePreviewDialog } from "@/components/billing/invoice-preview-dialog";
import { Prisma } from "@prisma/client";

import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Calculator,
  ShoppingBag,
  Eye,
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  Split,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function InvoiceBuilderPage(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Tenant Context
  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  // React Query Hooks
  const { data: customers = [] } = useCustomers(tId);
  const { data: inventoryItems = [] } = useInventoryItems(tId, { status: "in_stock" });
  const { data: settings } = useBusinessSettings(tId);

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);
  const { data: ratesData = [] } = useMetalRates(tId, { rateDate: todayStr });

  const { mutateAsync: createInvoice } = useCreateInvoice(tId);
  const { mutateAsync: finalizeInvoice } = useFinalizeInvoice(tId);
  const { mutateAsync: createCustomer } = useCreateCustomer(tId);

  // Preview dialog state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Step 1 Form Data (Mandatory Customer Details)
  const [customerId, setCustomerId] = useState<string>("");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [custSearch, setCustSearch] = useState<string>("");
  const [custDropdownOpen, setCustDropdownOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [newCustEmail, setNewCustEmail] = useState<string>("");
  const [newCustGstin, setNewCustGstin] = useState<string>("");
  const [newCustAddress, setNewCustAddress] = useState<string>("");

  // Step 4 Form Data (Payment Settlement)
  const [userSelectedPaymentMode, setUserSelectedPaymentMode] = useState<"cash" | "upi" | "card" | "split" | "due" | null>(null);
  const paymentMode = userSelectedPaymentMode ?? (settings?.defaultPaymentMode || "cash");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [digitalAmount, setDigitalAmount] = useState<string>("");
  const [userSelectedDigitalMethod, setUserSelectedDigitalMethod] = useState<"upi" | "card" | "bank_transfer" | null>(null);
  const digitalMethod = userSelectedDigitalMethod ?? (paymentMode === "card" ? "card" : "upi");
  const [digitalRef, setDigitalRef] = useState<string>("");
  const [settlementDueDate, setSettlementDueDate] = useState<string>("");

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Click outside listener for searchable select dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCustDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = React.useMemo(() => {
    if (!custSearch) return customers;
    const query = custSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.phone && c.phone.toLowerCase().includes(query))
    );
  }, [customers, custSearch]);

  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [invoiceType, setInvoiceType] = useState<string>("sales");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("27"); // MH default
  const [notes, setNotes] = useState<string>("");

  // Step 2 Form Data (Line Items)
  const [lines, setLines] = useState<LineItemInput[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);

  // Line Item Sheet State
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [lineDesc, setLineDesc] = useState<string>("");
  const [materialType, setMaterialType] = useState<"gold" | "silver" | "platinum" | "diamond" | "other">("gold");
  const [grossWeight, setGrossWeight] = useState<string>("");
  const [stoneWeight, setStoneWeight] = useState<string>("0");
  const [purity, setPurity] = useState<string>("0.916");
  const [metalRate, setMetalRate] = useState<string | null>(null);
  const [makingType, setMakingType] = useState<"PER_GRAM" | "PERCENT" | "FLAT">("PER_GRAM");
  const [makingVal, setMakingVal] = useState<string>("");
  const [wastageType, setWastageType] = useState<"PERCENT_WEIGHT" | "GRAMS" | "PERCENT_MAKING" | "NONE">("NONE");
  const [wastageVal, setWastageVal] = useState<string>("0");
  const [stoneType, setStoneType] = useState<"PER_CARAT" | "PER_PIECE" | "FLAT" | "NONE">("NONE");
  const [stoneCarat, setStoneCarat] = useState<string>("0");
  const [stonePieces, setStonePieces] = useState<number>(0);
  const [stoneRate, setStoneRate] = useState<string>("0");
  const [hallmark, setHallmark] = useState<string>("45");
  const [otherCharges, setOtherCharges] = useState<string>("0");
  const [lineDiscountType, setLineDiscountType] = useState<"AMOUNT" | "PERCENT" | "NONE">("NONE");
  const [lineDiscountValue, setLineDiscountValue] = useState<string>("0");

  // Step 3 Form Data (Old Gold & Global Discount)
  const [includeOldGold, setIncludeOldGold] = useState<boolean>(false);
  const [oldGoldWeight, setOldGoldWeight] = useState<string>("");
  const [oldGoldPurityRate, setOldGoldPurityRate] = useState<string>("");
  const [oldGoldDeduction, setOldGoldDeduction] = useState<string>("2");

  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"AMOUNT" | "PERCENT" | "NONE">("NONE");
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<string>("0");

  // Sync Item Select with details
  const handleItemSelect = (itemId: string): void => {
    setSelectedItemId(itemId);
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setLineDesc(item.product?.name || `Item tag ${item.tagNumber}`);
      setGrossWeight(item.grossWeight.toString());
      setStoneWeight(item.stoneWeight ? item.stoneWeight.toString() : "0");
      setPurity(item.purityFineness ? item.purityFineness.toString() : "0.916");
      setMaterialType((item.product?.metalType.toLowerCase() as "gold" | "silver" | "platinum" | "diamond" | "other") || "gold");
      if (item.wastagePercent) {
        setWastageType("PERCENT_WEIGHT");
        setWastageVal(item.wastagePercent.toString());
      }
    }
  };

  const handleAddLineItem = (): void => {
    const resolvedMetalRate = metalRate !== null ? metalRate : (ratesData[0]?.ratePerGram?.toString() || "");
    if (!lineDesc || !grossWeight || !resolvedMetalRate) {
      toast.error("Please fill in item description, gross weight, and metal rate.");
      return;
    }

    const newLine: LineItemInput = {
      inventoryItemId: selectedItemId || null,
      description: lineDesc,
      materialType,
      grossWeight: parseFloat(grossWeight),
      stoneWeight: parseFloat(stoneWeight),
      purity: parseFloat(purity),
      metalRatePerGram: parseFloat(resolvedMetalRate),
      makingChargeType: makingType,
      makingChargeValue: parseFloat(makingVal || "0"),
      wastageType,
      wastageValue: parseFloat(wastageVal || "0"),
      stoneChargeType: stoneType,
      stoneCarat: parseFloat(stoneCarat || "0"),
      stonePieces,
      stoneRate: parseFloat(stoneRate || "0"),
      hallmarkCharges: parseFloat(hallmark || "0"),
      otherCharges: parseFloat(otherCharges || "0"),
      lineDiscountType,
      lineDiscountValue: parseFloat(lineDiscountValue || "0"),
      quantity: 1,
    };

    setLines([...lines, newLine]);
    setIsAddItemOpen(false);

    // Reset Sheet Form
    setSelectedItemId("");
    setLineDesc("");
    setGrossWeight("");
    setStoneWeight("0");
    setMakingVal("");
    setWastageType("NONE");
    setWastageVal("0");
    setStoneType("NONE");
    setStoneCarat("0");
    setStonePieces(0);
    setStoneRate("0");
    setOtherCharges("0");
    setLineDiscountType("NONE");
    setLineDiscountValue("0");
    toast.success("Line item added!");
  };

  const handleRemoveLine = (idx: number): void => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  // Calculation and Settlement Helpers
  const currentInvoiceCalculation = React.useMemo(() => {
    if (lines.length === 0) return null;
    const sellerStateCode = settings?.gstin ? settings.gstin.substring(0, 2) : "27";
    const linesForCalc = lines.map((line) => ({
      productId: line.productId,
      inventoryItemId: line.inventoryItemId,
      hsnCodeId: line.hsnCodeId,
      description: line.description,
      materialType: line.materialType,
      karat: line.karat,
      quantity: line.quantity ?? 1,
      grossWeight: Number(line.grossWeight),
      stoneWeight: Number(line.stoneWeight),
      purity: Number(line.purity),
      metalRatePerGram: Number(line.metalRatePerGram),
      makingChargeType: line.makingChargeType,
      makingChargeValue: Number(line.makingChargeValue),
      wastageType: line.wastageType,
      wastageValue: Number(line.wastageValue),
      stoneChargeType: line.stoneChargeType,
      stoneCarat: Number(line.stoneCarat ?? 0),
      stonePieces: Number(line.stonePieces ?? 0),
      stoneRate: Number(line.stoneRate ?? 0),
      hallmarkCharges: Number(line.hallmarkCharges ?? 0),
      otherCharges: Number(line.otherCharges ?? 0),
      lineDiscountType: line.lineDiscountType,
      lineDiscountValue: Number(line.lineDiscountValue ?? 0),
      gstRatePercent: Number(line.gstRatePercent ?? settings?.defaultGstRate ?? 3.0),
      sellerStateCode,
      placeOfSupplyStateCode: placeOfSupply,
    }));

    let oldGoldVal = 0;
    if (includeOldGold && oldGoldWeight && oldGoldPurityRate) {
      const netWeight = parseFloat(oldGoldWeight);
      const purityRate = parseFloat(oldGoldPurityRate);
      const deductionPercent = parseFloat(oldGoldDeduction || "0");
      const multiplier = 1 - deductionPercent / 100;
      oldGoldVal = netWeight * purityRate * multiplier;
    }

    try {
      return calculateInvoice(
        linesForCalc,
        invoiceDiscountType,
        parseFloat(invoiceDiscountValue || "0"),
        oldGoldVal
      );
    } catch {
      return null;
    }
  }, [
    lines,
    settings,
    placeOfSupply,
    includeOldGold,
    oldGoldWeight,
    oldGoldPurityRate,
    oldGoldDeduction,
    invoiceDiscountType,
    invoiceDiscountValue,
  ]);

  const netPayableNumber = currentInvoiceCalculation ? Number(currentInvoiceCalculation.grandTotal) : 0;
  const parsedCash = parseFloat(cashAmount || "0");
  const parsedDigital = parseFloat(digitalAmount || "0");
  const validCash = isNaN(parsedCash) ? 0 : parsedCash;
  const validDigital = isNaN(parsedDigital) ? 0 : parsedDigital;
  const totalPaid = validCash + validDigital;
  const balanceDue = Math.max(0, netPayableNumber - totalPaid);

  const handlePaymentModeSelect = (mode: "cash" | "upi" | "card" | "split" | "due"): void => {
    setUserSelectedPaymentMode(mode);
    if (mode === "cash") {
      setCashAmount(netPayableNumber > 0 ? netPayableNumber.toFixed(2) : "");
      setDigitalAmount("0");
    } else if (mode === "upi") {
      setCashAmount("0");
      setDigitalAmount(netPayableNumber > 0 ? netPayableNumber.toFixed(2) : "");
      setUserSelectedDigitalMethod("upi");
    } else if (mode === "card") {
      setCashAmount("0");
      setDigitalAmount(netPayableNumber > 0 ? netPayableNumber.toFixed(2) : "");
      setUserSelectedDigitalMethod("card");
    } else if (mode === "split") {
      const half = netPayableNumber > 0 ? (netPayableNumber / 2).toFixed(2) : "";
      setCashAmount(half);
      setDigitalAmount(netPayableNumber > 0 ? (netPayableNumber - Number(half)).toFixed(2) : "");
    } else if (mode === "due") {
      setCashAmount("0");
      setDigitalAmount("0");
    }
  };

  const handleNext = (): void => {
    if (step === 1) {
      if (customerMode === "existing" && !customerId) {
        toast.error("Please select an existing customer before proceeding.");
        return;
      }
      if (customerMode === "new") {
        if (!newCustName.trim()) {
          toast.error("Please enter the customer's full name.");
          return;
        }
        const cleanPhone = newCustPhone.trim().replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length < 10) {
          toast.error("Please enter a valid customer phone number (minimum 10 digits).");
          return;
        }
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (lines.length === 0) {
        toast.error("Please add at least one line item to the invoice.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!cashAmount && !digitalAmount && netPayableNumber > 0) {
        handlePaymentModeSelect(paymentMode);
      }
      setStep(4);
      return;
    }
  };

  // Submit Draft or Final Invoice
  const handleSaveInvoice = async (finalize: boolean): Promise<void> => {
    if (lines.length === 0) {
      toast.error("Please add at least one line item.");
      return;
    }

    if (customerMode === "existing" && !customerId) {
      toast.error("Please select an existing customer.");
      return;
    }

    if (customerMode === "new") {
      if (!newCustName.trim()) {
        toast.error("Please enter the customer's full name.");
        return;
      }
      const cleanPhone = newCustPhone.trim().replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        toast.error("Please enter a valid customer phone number (minimum 10 digits).");
        return;
      }
    }

    try {
      setSubmitting(true);

      let resolvedCustomerId: string | null = null;
      if (customerMode === "existing") {
        resolvedCustomerId = customerId;
      } else if (customerMode === "new") {
        toast.info("Registering customer...");
        const newCust = await createCustomer({
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          email: newCustEmail.trim() || undefined,
          gstin: newCustGstin.trim() || undefined,
          addressJson: newCustAddress.trim() ? { street: newCustAddress.trim() } : undefined,
        });
        resolvedCustomerId = newCust.id;
      }

      const oldGold: OldGoldExchangeInput | null = includeOldGold && oldGoldWeight && oldGoldPurityRate
        ? {
            netWeight: parseFloat(oldGoldWeight),
            purityRate: parseFloat(oldGoldPurityRate),
            deductionPercent: parseFloat(oldGoldDeduction || "0"),
          }
        : null;

      const payload: InvoiceCreateInput = {
        customerId: resolvedCustomerId,
        invoiceDate: new Date(invoiceDate),
        dueDate: balanceDue > 0 && settlementDueDate ? new Date(settlementDueDate) : null,
        type: invoiceType as "sales" | "purchase" | "quotation" | "estimate" | "return" | "exchange" | "repair",
        placeOfSupply,
        invoiceDiscountType,
        invoiceDiscountValue: parseFloat(invoiceDiscountValue || "0"),
        notes: notes || null,
        lines: lines,
        oldGoldExchange: oldGold,
      };

      const createdInvoice = await createInvoice(payload);

      if (finalize) {
        toast.info("Finalizing invoice & allocating stock...");
        const initialPayments: InitialPaymentInput[] = [];
        if (validCash > 0) {
          initialPayments.push({
            amount: validCash,
            method: "cash",
          });
        }
        if (validDigital > 0) {
          initialPayments.push({
            amount: validDigital,
            method: digitalMethod,
            referenceNo: digitalRef.trim() || undefined,
          });
        }

        await finalizeInvoice({
          id: createdInvoice.id,
          data: {
            initialPayments: initialPayments.length > 0 ? initialPayments : undefined,
            dueDate: balanceDue > 0 && settlementDueDate ? settlementDueDate : undefined,
          },
        });
        toast.success("Invoice finalized and stock updated!");
        // Automatically open PDF in a new tab
        window.open(`/api/v1/invoices/${createdInvoice.id}/pdf?stream=true`, "_blank");
      } else {
        toast.success("Invoice draft saved successfully!");
      }

      router.push(`/invoices/${createdInvoice.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save invoice";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const computedPreviewInvoice = React.useMemo(() => {
    if (lines.length === 0 || !isPreviewOpen) return null;

    // Resolve sellerStateCode
    const sellerStateCode = settings?.gstin ? settings.gstin.substring(0, 2) : "27";

    const linesForCalc = lines.map(line => ({
      productId: line.productId,
      inventoryItemId: line.inventoryItemId,
      hsnCodeId: line.hsnCodeId,
      description: line.description,
      materialType: line.materialType,
      karat: line.karat,
      quantity: line.quantity ?? 1,
      grossWeight: Number(line.grossWeight),
      stoneWeight: Number(line.stoneWeight),
      purity: Number(line.purity),
      metalRatePerGram: Number(line.metalRatePerGram),
      makingChargeType: line.makingChargeType,
      makingChargeValue: Number(line.makingChargeValue),
      wastageType: line.wastageType,
      wastageValue: Number(line.wastageValue),
      stoneChargeType: line.stoneChargeType,
      stoneCarat: Number(line.stoneCarat ?? 0),
      stonePieces: Number(line.stonePieces ?? 0),
      stoneRate: Number(line.stoneRate ?? 0),
      hallmarkCharges: Number(line.hallmarkCharges ?? 0),
      otherCharges: Number(line.otherCharges ?? 0),
      lineDiscountType: line.lineDiscountType,
      lineDiscountValue: Number(line.lineDiscountValue ?? 0),
      gstRatePercent: Number(line.gstRatePercent ?? settings?.defaultGstRate ?? 3.0),
      sellerStateCode,
      placeOfSupplyStateCode: placeOfSupply,
    }));

    // Calculate old gold value
    let oldGoldVal = 0;
    if (includeOldGold && oldGoldWeight && oldGoldPurityRate) {
      const netWeight = parseFloat(oldGoldWeight);
      const purityRate = parseFloat(oldGoldPurityRate);
      const deductionPercent = parseFloat(oldGoldDeduction || "0");
      const multiplier = 1 - deductionPercent / 100;
      oldGoldVal = netWeight * purityRate * multiplier;
    }

    try {
      const calcResult = calculateInvoice(
        linesForCalc,
        invoiceDiscountType,
        parseFloat(invoiceDiscountValue || "0"),
        oldGoldVal
      );

      const previewLines = calcResult.lines.map((l, idx) => {
        const originalLine = lines[idx];
        return {
          description: originalLine.description,
          karat: originalLine.karat,
          purityFineness: originalLine.purity.toString(),
          grossWeight: originalLine.grossWeight.toString(),
          netWeight: l.netWeight.toString(),
          ratePerGram: originalLine.metalRatePerGram.toString(),
          makingCharge: l.makingCharges.toString(),
          stoneCharge: l.stoneCharges.toString(),
          discount: l.lineDiscount.toString(),
          taxableValue: l.taxableValue.toString(),
          cgstAmount: l.cgst.toString(),
          sgstAmount: l.sgst.toString(),
          igstAmount: l.igst.toString(),
          lineTotal: l.lineTotal.toString(),
        };
      });

      const resolvedCustomerName = customerMode === "existing"
        ? (customers.find(c => c.id === customerId)?.name || "Existing Customer")
        : newCustName.trim() || "Customer";

      const resolvedCustomerPhone = customerMode === "existing"
        ? (customers.find(c => c.id === customerId)?.phone || null)
        : newCustPhone.trim() || null;

      const resolvedCustomerEmail = customerMode === "existing"
        ? (customers.find(c => c.id === customerId)?.email || null)
        : newCustEmail.trim() || null;

      const resolvedCustomerGstin = customerMode === "existing"
        ? (customers.find(c => c.id === customerId)?.gstin || null)
        : newCustGstin.trim() || null;

      const resolvedCustomerAddress = customerMode === "existing"
        ? (customers.find(c => c.id === customerId)?.addressJson || null)
        : (newCustAddress.trim() ? { street: newCustAddress.trim() } : null);

      const customerDetails = {
        name: resolvedCustomerName,
        phone: resolvedCustomerPhone,
        email: resolvedCustomerEmail,
        gstin: resolvedCustomerGstin,
        addressJson: resolvedCustomerAddress as PreviewCustomer["addressJson"],
      };

      const simPayments: Array<{
        id?: string;
        method: string;
        amount: string;
        exchangeMetalWeight?: string | null;
        exchangeMetalValue?: string | null;
        referenceNo?: string | null;
      }> = [];

      if (includeOldGold && oldGoldWeight && oldGoldPurityRate) {
        simPayments.push({
          method: "gold_exchange",
          amount: oldGoldVal.toString(),
          exchangeMetalWeight: oldGoldWeight,
          exchangeMetalValue: oldGoldVal.toString(),
        });
      }

      if (validCash > 0) {
        simPayments.push({
          method: "cash",
          amount: validCash.toFixed(2),
        });
      }

      if (validDigital > 0) {
        simPayments.push({
          method: digitalMethod,
          amount: validDigital.toFixed(2),
          referenceNo: digitalRef.trim() || null,
        });
      }

      return {
        invoice: {
          invoiceNumber: "DRAFT-PREVIEW",
          invoiceDate: invoiceDate,
          dueDate: balanceDue > 0 && settlementDueDate ? settlementDueDate : undefined,
          type: invoiceType,
          status: totalPaid >= Number(calcResult.grandTotal) ? "paid" : totalPaid > 0 ? "partially_paid" : "issued",
          placeOfSupply: placeOfSupply,
          subtotal: calcResult.subTotalTaxable.toString(),
          makingChargesTotal: calcResult.lines.reduce((sum, l) => sum.add(l.makingCharges), new Prisma.Decimal(0)).toString(),
          discountTotal: calcResult.lines.reduce((sum, l) => sum.add(l.lineDiscount), new Prisma.Decimal(0)).toString(),
          cgstTotal: calcResult.totalCgst.toString(),
          sgstTotal: calcResult.totalSgst.toString(),
          igstTotal: calcResult.totalIgst.toString(),
          roundOff: calcResult.roundOff.toString(),
          grandTotal: calcResult.grandTotal.toString(),
          amountPaid: totalPaid.toFixed(2),
          balanceDue: balanceDue.toFixed(2),
          notes: notes,
          lineItems: previewLines,
          payments: simPayments,
        },
        customer: customerDetails,
      };
    } catch (e) {
      console.error("Error calculating preview invoice", e);
      return null;
    }
  }, [
    lines,
    isPreviewOpen,
    settings,
    placeOfSupply,
    includeOldGold,
    oldGoldWeight,
    oldGoldPurityRate,
    oldGoldDeduction,
    invoiceDiscountType,
    invoiceDiscountValue,
    customerMode,
    customerId,
    customers,
    newCustName,
    newCustPhone,
    newCustEmail,
    newCustGstin,
    newCustAddress,
    invoiceDate,
    invoiceType,
    notes,
    validCash,
    validDigital,
    digitalMethod,
    digitalRef,
    totalPaid,
    balanceDue,
    settlementDueDate,
  ]);

  interface PreviewCustomer {
    name: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    addressJson?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    } | string | null;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Wizard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">
            Step {step} of 4:{" "}
            {step === 1
              ? "Customer & Billing"
              : step === 2
              ? "Add Line Items"
              : step === 3
              ? "Discounts & Old Gold"
              : "Payment & Settlement"}
          </p>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          {step < 4 ? (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium" onClick={handleNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={lines.length === 0 || submitting}>
                <Eye className="mr-2 h-4 w-4" /> Preview Bill
              </Button>
              <Button variant="outline" onClick={() => void handleSaveInvoice(false)} disabled={submitting}>
                Save Draft
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md" onClick={() => void handleSaveInvoice(true)} disabled={submitting}>
                <Calculator className="mr-2 h-4 w-4" /> Finalize & Issue
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Customer Details */}
      {step === 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Customer & Billing Settings</CardTitle>
            <CardDescription>Select customer and tax settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Selector Mode Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Customer Identification <span className="text-destructive">*</span></Label>
                <span className="text-xs text-muted-foreground">Every invoice requires customer name & phone</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg max-w-md">
                <button
                  type="button"
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    customerMode === "existing"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setCustomerMode("existing");
                    setCustomerId("");
                    setCustSearch("");
                  }}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    customerMode === "new"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setCustomerMode("new");
                    setCustomerId("");
                  }}
                >
                  New Customer / Walk-in
                </button>
              </div>
            </div>

            {customerMode === "existing" && (
              <div className="space-y-2 relative" ref={dropdownRef}>
                <Label htmlFor="cust-search">Search Existing Customer <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="cust-search"
                    placeholder="Search by Name or Mobile Number..."
                    value={custSearch}
                    onChange={(e) => {
                      setCustSearch(e.target.value);
                      setCustDropdownOpen(true);
                    }}
                    onFocus={() => setCustDropdownOpen(true)}
                  />
                  {customerId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCustomerId("");
                        setCustSearch("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {custDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground text-center">No customers match your search.</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground border-b last:border-b-0 transition-colors"
                          onClick={() => {
                            setCustomerId(c.id);
                            setCustSearch(`${c.name} ${c.phone ? `(${c.phone})` : ""}`);
                            setCustDropdownOpen(false);
                          }}
                        >
                          <div className="font-semibold">{c.name}</div>
                          {c.phone && <div className="text-xs text-muted-foreground">Mobile: {c.phone}</div>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {customerMode === "new" && (
              <div className="border p-4 rounded-lg bg-muted/10 space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Customer Details (Name & Phone Mandatory)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="new-name"
                      placeholder="e.g. Rahul Sharma"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-phone">Phone Number (10 digits) <span className="text-destructive">*</span></Label>
                    <Input
                      id="new-phone"
                      placeholder="e.g. 9876543210"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email">Email Address</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-gstin">GSTIN (For B2B)</Label>
                    <Input
                      id="new-gstin"
                      placeholder="e.g. 27AAAAA1111A1Z1 (Required for B2B)"
                      value={newCustGstin}
                      onChange={(e) => setNewCustGstin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-address">Postal Address</Label>
                  <Input
                    id="new-address"
                    placeholder="e.g. Flat 101, Park Avenue, Mumbai"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Other Billing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-muted">
              <div className="space-y-2">
                <Label htmlFor="supply">Place of Supply (GST State Code)</Label>
                <Input
                  id="supply"
                  placeholder="e.g. 27 for Maharashtra"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-type">Invoice Type</Label>
                <Select id="inv-type" value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                  <option value="sales">GST Tax Invoice (Sales)</option>
                  <option value="quotation">Quotation / Estimate</option>
                  <option value="purchase">Purchase Voucher (Metal Inflow)</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Terms</Label>
              <Input
                id="notes"
                placeholder="Include custom terms or details about the order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Line Items */}
      {step === 2 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoice Line Items</CardTitle>
              <CardDescription>Configure pricing components for each piece of jewellery.</CardDescription>
            </div>
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-y-auto max-h-[90vh] sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Jewellery Item</DialogTitle>
                  <DialogDescription>Configure spot rate, making charges, wastage, and stone valuations.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Inventory Item Link */}
                  <div className="space-y-1">
                    <Label htmlFor="inv-item">Link Stock Item (Optional)</Label>
                    <Select id="inv-item" value={selectedItemId} onChange={(e) => handleItemSelect(e.target.value)}>
                      <option value="">No Link (Manual Entry)</option>
                      {inventoryItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.tagNumber ? `Tag: ${item.tagNumber}` : item.product?.name} ({item.grossWeight.toString()}g)
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="desc">Item Description</Label>
                    <Input id="desc" value={lineDesc} onChange={(e) => setLineDesc(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="material">Metal</Label>
                      <Select id="material" value={materialType} onChange={(e) => setMaterialType(e.target.value as "gold" | "silver" | "platinum" | "diamond" | "other")}>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="platinum">Platinum</option>
                        <option value="diamond">Diamond</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="purity-fineness">Purity Fineness</Label>
                      <Input id="purity-fineness" value={purity} onChange={(e) => setPurity(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="gross">Gross Weight (g)</Label>
                      <Input id="gross" type="number" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stone-wt">Stone Weight (g)</Label>
                      <Input id="stone-wt" type="number" value={stoneWeight} onChange={(e) => setStoneWeight(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="metal-rate">Metal Rate per Gram (INR)</Label>
                    <Input id="metal-rate" type="number" value={metalRate !== null ? metalRate : (ratesData[0]?.ratePerGram?.toString() || "")} onChange={(e) => setMetalRate(e.target.value)} required />
                  </div>

                  {/* Making Charges (D1 selector) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="making-type">Making Charge Type</Label>
                      <Select id="making-type" value={makingType} onChange={(e) => setMakingType(e.target.value as "PER_GRAM" | "PERCENT" | "FLAT")}>
                        <option value="PER_GRAM">Per Gram (NW)</option>
                        <option value="PERCENT">Percent (%)</option>
                        <option value="FLAT">Flat Rate</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="making-val">Making Value</Label>
                      <Input id="making-val" type="number" value={makingVal} onChange={(e) => setMakingVal(e.target.value)} />
                    </div>
                  </div>

                  {/* Wastage */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="wastage-type">Wastage Type</Label>
                      <Select id="wastage-type" value={wastageType} onChange={(e) => setWastageType(e.target.value as "PERCENT_WEIGHT" | "GRAMS" | "PERCENT_MAKING" | "NONE")}>
                        <option value="NONE">None</option>
                        <option value="PERCENT_WEIGHT">Percent Weight (%)</option>
                        <option value="GRAMS">Fixed Grams</option>
                        <option value="PERCENT_MAKING">Percent Making (%)</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="wastage-val">Wastage Value</Label>
                      <Input id="wastage-val" type="number" value={wastageVal} onChange={(e) => setWastageVal(e.target.value)} />
                    </div>
                  </div>

                  {/* Stone Charges */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="stone-type">Stone Charge Type</Label>
                      <Select id="stone-type" value={stoneType} onChange={(e) => setStoneType(e.target.value as "PER_CARAT" | "PER_PIECE" | "FLAT" | "NONE")}>
                        <option value="NONE">None</option>
                        <option value="PER_CARAT">Per Carat</option>
                        <option value="PER_PIECE">Per Piece</option>
                        <option value="FLAT">Flat Charges</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="stone-rate">Stone Rate (INR)</Label>
                      <Input id="stone-rate" type="number" value={stoneRate} onChange={(e) => setStoneRate(e.target.value)} />
                    </div>
                  </div>

                  {stoneType === "PER_CARAT" && (
                    <div className="space-y-1">
                      <Label htmlFor="carat">Stone Carat</Label>
                      <Input id="carat" type="number" value={stoneCarat} onChange={(e) => setStoneCarat(e.target.value)} />
                    </div>
                  )}

                  {stoneType === "PER_PIECE" && (
                    <div className="space-y-1">
                      <Label htmlFor="pieces">Stone Pieces</Label>
                      <Input id="pieces" type="number" value={stonePieces} onChange={(e) => setStonePieces(parseInt(e.target.value, 10))} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="hallmark">Hallmark charges</Label>
                      <Input id="hallmark" type="number" value={hallmark} onChange={(e) => setHallmark(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="other">Other charges</Label>
                      <Input id="other" type="number" value={otherCharges} onChange={(e) => setOtherCharges(e.target.value)} />
                    </div>
                  </div>

                  <Button className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700" onClick={handleAddLineItem}>
                    Add Line Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted/20 rounded-lg p-6">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/45 mb-2" />
                <p className="text-muted-foreground font-medium">Add jewellery pieces to populate the invoice.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Gross Wt</TableHead>
                      <TableHead className="text-right">Net Wt</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Making</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{l.description}</TableCell>
                        <TableCell className="text-right">{Number(l.grossWeight).toFixed(3)}g</TableCell>
                        <TableCell className="text-right">{(Number(l.grossWeight) - Number(l.stoneWeight)).toFixed(3)}g</TableCell>
                        <TableCell className="text-right">₹{Number(l.metalRatePerGram).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{Number(l.makingChargeValue).toFixed(2)} ({l.makingChargeType.replace("_", " ")})</TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveLine(index)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Global Discounts & Old Gold Exchange */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Old Gold Valuation */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Old Gold Exchange</CardTitle>
                    <CardDescription>Value customer exchange jewellery for adjustments.</CardDescription>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeOldGold}
                    onChange={(e) => setIncludeOldGold(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                </div>
              </CardHeader>
              {includeOldGold && (
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="og-wt">Old Gold Net Weight (g)</Label>
                    <Input id="og-wt" type="number" value={oldGoldWeight} onChange={(e) => setOldGoldWeight(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og-rate">Exchange Rate (per gram)</Label>
                    <Input id="og-rate" type="number" value={oldGoldPurityRate} onChange={(e) => setOldGoldPurityRate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og-deduct">Deduction Percent (%)</Label>
                    <Input id="og-deduct" type="number" value={oldGoldDeduction} onChange={(e) => setOldGoldDeduction(e.target.value)} />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Global Discount */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Invoice Discount</CardTitle>
                <CardDescription>Apply invoice-level discounts (apportioned to lines).</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={invoiceDiscountType} onChange={(e) => setInvoiceDiscountType(e.target.value as "AMOUNT" | "PERCENT" | "NONE")}>
                    <option value="NONE">No Discount</option>
                    <option value="AMOUNT">Flat Amount (INR)</option>
                    <option value="PERCENT">Percent (%)</option>
                  </Select>
                </div>
                {invoiceDiscountType !== "NONE" && (
                  <div className="space-y-2">
                    <Label>Discount Value</Label>
                    <Input type="number" value={invoiceDiscountValue} onChange={(e) => setInvoiceDiscountValue(e.target.value)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Summary Cart */}
          <div className="md:col-span-1">
            <Card className="shadow-lg border-indigo-100 bg-indigo-50/20">
              <CardHeader>
                <CardTitle>Cart Summary</CardTitle>
                <CardDescription>Invoice totals pre-computation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Line Items Count:</span>
                  <span className="font-semibold">{lines.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2 border-slate-200">
                  <span>Gross Weight Sum:</span>
                  <span className="font-semibold">
                    {lines.reduce((sum, l) => sum + Number(l.grossWeight), 0).toFixed(3)}g
                  </span>
                </div>
                {includeOldGold && oldGoldWeight && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Old Gold Exchange:</span>
                    <span>{oldGoldWeight}g</span>
                  </div>
                )}
                <div className="bg-indigo-50 dark:bg-slate-800 p-3 rounded-lg border border-indigo-100 text-xs text-muted-foreground mt-4">
                  Invoice totals and tax breakdown (CGST/SGST/IGST) will be calculated and finalized server-side upon saving.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Payment & Settlement */}
      {step === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Mode of Payment */}
            <Card className="shadow-lg border-primary/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      Select Payment Mode
                    </CardTitle>
                    <CardDescription>
                      Choose how the customer is settling this invoice.
                    </CardDescription>
                  </div>
                  {/* Status Badge */}
                  <div>
                    {totalPaid >= netPayableNumber && netPayableNumber > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" /> PAID IN FULL
                      </span>
                    ) : totalPaid > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" /> PARTIALLY PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        <Calendar className="h-3.5 w-3.5" /> DUE / UNPAID
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Selector Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: "cash", label: "Cash", desc: "100% Cash", icon: Banknote },
                    { id: "upi", label: "UPI / QR", desc: "GPay/PhonePe", icon: Smartphone },
                    { id: "card", label: "Card", desc: "Debit / Credit", icon: CreditCard },
                    { id: "split", label: "Split", desc: "Cash + Digital", icon: Split },
                    { id: "due", label: "Pay Later", desc: "Credit / Due", icon: Calendar },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handlePaymentModeSelect(m.id as "cash" | "upi" | "card" | "split" | "due")}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-semibold"
                            : "border-slate-200 dark:border-slate-800 hover:bg-muted/50 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1.5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                        <span className="text-xs">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Cash Details */}
                {(paymentMode === "cash" || paymentMode === "split") && (
                  <div className="border rounded-lg p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Banknote className="h-4 w-4 text-emerald-600" /> Cash Payment
                      </div>
                      {paymentMode === "split" && (
                        <span className="text-[11px] text-muted-foreground">Specify amount received in cash</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cash-amount">Cash Amount (₹)</Label>
                        <Input
                          id="cash-amount"
                          type="number"
                          placeholder="0.00"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cash-tendered">Cash Tendered (Change helper)</Label>
                        <Input
                          id="cash-tendered"
                          type="number"
                          placeholder="Amount given by customer"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                        />
                      </div>
                    </div>
                    {Number(cashTendered) > Number(cashAmount) && Number(cashAmount) > 0 && (
                      <div className="p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 flex justify-between font-medium">
                        <span>Change to Return Customer:</span>
                        <span className="font-bold">₹{(Number(cashTendered) - Number(cashAmount)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Digital / Card / UPI Details */}
                {(paymentMode === "upi" || paymentMode === "card" || paymentMode === "split") && (
                  <div className="border rounded-lg p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4 text-indigo-600" /> Digital / Card Settlement
                      </div>
                      <div className="flex gap-2">
                        {(["upi", "card", "bank_transfer"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setUserSelectedDigitalMethod(m)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium uppercase border ${
                              digitalMethod === m
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {m === "bank_transfer" ? "Bank" : m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="digital-amount">Digital Amount (₹)</Label>
                        <Input
                          id="digital-amount"
                          type="number"
                          placeholder="0.00"
                          value={digitalAmount}
                          onChange={(e) => setDigitalAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="digital-ref">Reference / UTR / Approval No.</Label>
                        <Input
                          id="digital-ref"
                          placeholder="e.g. UPI Ref / Approval Code"
                          value={digitalRef}
                          onChange={(e) => setDigitalRef(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Balance Due & Due Date Picker */}
                {balanceDue > 0 && (
                  <div className="border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-amber-600" /> Balance Due Schedule
                      </span>
                      <span>₹{balanceDue.toFixed(2)} Remaining</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="settlement-due-date" className="text-xs">Promise / Due Date for Balance Payment</Label>
                      <Input
                        id="settlement-due-date"
                        type="date"
                        value={settlementDueDate}
                        onChange={(e) => setSettlementDueDate(e.target.value)}
                        className="bg-background max-w-xs"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Payment Settlement Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg border-indigo-100 bg-indigo-50/20">
              <CardHeader>
                <CardTitle className="text-base">Settlement Summary</CardTitle>
                <CardDescription>Breakdown before bill finalization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Bill Total:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{netPayableNumber.toFixed(2)}</span>
                </div>
                {Number(cashAmount) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
                    <span>Cash Payment:</span>
                    <span className="font-semibold">₹{Number(cashAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(digitalAmount) > 0 && (
                  <div className="flex justify-between text-xs text-indigo-700 dark:text-indigo-400">
                    <span>{digitalMethod.toUpperCase()} Digital:</span>
                    <span className="font-semibold">₹{Number(digitalAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 border-slate-200 font-medium">
                  <span>Total Amount Paid:</span>
                  <span className="font-semibold text-emerald-600">₹{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 border-slate-200">
                  <span className="font-bold">Balance Due:</span>
                  <span className={`font-extrabold ${balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    ₹{balanceDue.toFixed(2)}
                  </span>
                </div>
                {balanceDue > 0 && settlementDueDate && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Due Date:</span>
                    <span>{settlementDueDate}</span>
                  </div>
                )}

                <div className="bg-background p-3 rounded-lg border text-xs text-muted-foreground mt-4 space-y-1">
                  <p className="font-semibold text-foreground">Finalization Note:</p>
                  <p>Stock will be deducted, invoice numbers locked, and invoice status marked as <strong>{totalPaid >= netPayableNumber && netPayableNumber > 0 ? "PAID" : totalPaid > 0 ? "PARTIALLY PAID" : "ISSUED / DUE"}</strong>.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {computedPreviewInvoice && (
        <InvoicePreviewDialog
          invoice={computedPreviewInvoice.invoice}
          customer={computedPreviewInvoice.customer}
          tenantName={settings?.name || "Jewellery Showroom"}
          tenantGstin={settings?.gstin}
          tenantAddress={formatAddress(settings?.addressJson)}
          tenantPhone={settings?.contactPhone}
          defaultTemplate={settings?.defaultTemplateId}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white animate-in fade-in duration-200">
          <div className="flex flex-col items-center space-y-4 p-6 rounded-lg bg-slate-900/90 border border-slate-800 shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg text-white">Processing Invoice</h3>
              <p className="text-sm text-slate-400 max-w-xs">
                Saving customer data, allocating stock items, and finalizing bill...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
