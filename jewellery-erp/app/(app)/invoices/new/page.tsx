"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { invoiceApi, InvoiceCreateInput, LineItemInput, OldGoldExchangeInput } from "@/lib/api/invoices.api";
import { customerApi } from "@/lib/api/customer.api";
import { inventoryApi, InventoryItemWithRelations } from "@/lib/api/inventory.api";
import { metalRateApi } from "@/lib/api/metal-rates.api";
import { Customer } from "@prisma/client";
import { ChevronRight, ChevronLeft, Plus, Trash2, Calculator, ShoppingBag } from "lucide-react";

export default function InvoiceBuilderPage(): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Master Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithRelations[]>([]);

  // Step 1 Form Data
  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate] = useState<string>("");
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
  const [metalRate, setMetalRate] = useState<string>("");
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

  // Load Customers, Inventory Items, and Today's Rates
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const custRes = await customerApi.getCustomers();
        setCustomers(custRes.data);

        const invRes = await inventoryApi.getInventoryItems({ status: "in_stock" });
        setInventoryItems(invRes.data);

        // Prepopulate rate if today's rate exists
        const rateRes = await metalRateApi.getMetalRates({ rateDate: new Date().toISOString().split("T")[0] });
        if (rateRes.data.length > 0) {
          setMetalRate(rateRes.data[0].ratePerGram);
        }
      } catch (err: unknown) {
        console.error(err);
      }
    };
    void loadData();
  }, []);

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
    if (!lineDesc || !grossWeight || !metalRate) {
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
      metalRatePerGram: parseFloat(metalRate),
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

  // Submit Draft or Final Invoice
  const handleSaveInvoice = async (finalize: boolean): Promise<void> => {
    if (lines.length === 0) {
      toast.error("Please add at least one line item.");
      return;
    }

    try {
      setSubmitting(true);
      const oldGold: OldGoldExchangeInput | null = includeOldGold && oldGoldWeight && oldGoldPurityRate
        ? {
            netWeight: parseFloat(oldGoldWeight),
            purityRate: parseFloat(oldGoldPurityRate),
            deductionPercent: parseFloat(oldGoldDeduction || "0"),
          }
        : null;

      const payload: InvoiceCreateInput = {
        customerId: customerId || null,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        type: invoiceType as "sales" | "purchase" | "quotation" | "estimate" | "return" | "exchange" | "repair",
        placeOfSupply,
        invoiceDiscountType,
        invoiceDiscountValue: parseFloat(invoiceDiscountValue || "0"),
        notes: notes || null,
        lines: lines,
        oldGoldExchange: oldGold,
      };

      const res = await invoiceApi.createInvoice(payload);
      const createdInvoice = res.data;

      if (finalize) {
        toast.info("Finalizing invoice...");
        await invoiceApi.finalizeInvoice(createdInvoice.id);
        toast.success("Invoice finalized and stock updated!");
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

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Wizard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Step {step} of 3: {step === 1 ? "Billing Details" : step === 2 ? "Add Line Items" : "Review & Issue"}</p>
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium" onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="space-x-2">
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </Select>
              </div>

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
            <Sheet open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Add Jewellery Item</SheetTitle>
                  <SheetDescription>Configure spot rate, making charges, wastage, and stone valuations.</SheetDescription>
                </SheetHeader>
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
                    <Input id="metal-rate" type="number" value={metalRate} onChange={(e) => setMetalRate(e.target.value)} required />
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
              </SheetContent>
            </Sheet>
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
    </div>
  );
}
