"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/lib/query/hooks/use-business-settings";
import { useMetalRates, useCreateMetalRate } from "@/lib/query/hooks/use-metal-rates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { Coins, LayoutGrid, Loader2, Save, Search, Settings2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MetalType } from "@prisma/client";
import { TEMPLATES } from "@/constants/templates";
import { createInitialInvoice } from "@/constants/defaults";
import { TemplateThumbnail } from "@/components/gallery/template-thumbnail";

const BusinessSettingsSchema = z.object({
  name: z.string().min(1, "Business Name is required"),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  pan: z.string().length(10, "PAN must be 10 characters").or(z.literal("")).nullable(),
  contactEmail: z.string().email("Invalid email").or(z.literal("")).nullable(),
  contactPhone: z.string().min(10, "Phone must be at least 10 digits").or(z.literal("")).nullable(),
  addressStreet: z.string().optional().nullable(),
  addressCity: z.string().optional().nullable(),
  addressState: z.string().optional().nullable(),
  addressPostalCode: z.string().optional().nullable(),
  addressCountry: z.string().default("India").optional().nullable(),
  baseCurrency: z.string().length(3),
  defaultGstRate: z.coerce.number().nonnegative("GST rate must be non-negative"),
  gstRegistered: z.coerce.boolean(),
  makingChargeMode: z.string(),
  defaultMakingCharge: z.coerce.number().nonnegative("Making charge must be non-negative"),
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  invoiceNextSeq: z.coerce.string().min(1, "Next sequence is required"),
  financialYearStartMonth: z.coerce.number().int().min(1).max(12),
  defaultTemplateId: z.string().nullable().optional(),
  defaultPaymentMode: z.enum(["cash", "upi", "card", "split", "due"]).default("cash"),
});

type BusinessSettingsFormValues = z.infer<typeof BusinessSettingsSchema>;

const MetalRateSchema = z.object({
  metalType: z.nativeEnum(MetalType),
  purityFineness: z.coerce.string().min(1, "Purity fineness is required for Gold/Silver"),
  ratePerGram: z.coerce.number().positive("Rate per gram must be greater than 0"),
  source: z.string().optional(),
});

type MetalRateFormValues = z.infer<typeof MetalRateSchema>;

export default function BusinessSettingsPage() {
  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  // Queries & Mutations
  const { data: settings, isLoading: settingsLoading } = useBusinessSettings(tId);
  const { mutate: updateSettings, isPending: settingsUpdating } = useUpdateBusinessSettings(tId);
  const { data: rates, isLoading: ratesLoading } = useMetalRates(tId);
  const { mutate: createRate, isPending: rateCreating } = useCreateMetalRate(tId);

  // General Settings Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(BusinessSettingsSchema),
  });

  // Reset form when settings load
  React.useEffect(() => {
    if (settings) {
      const addr = settings.address || (typeof settings.addressJson === "object" && settings.addressJson !== null ? (settings.addressJson as Record<string, string>) : null);
      reset({
        name: settings.name,
        gstin: settings.gstin || "",
        pan: settings.pan || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        addressStreet: addr?.street || "",
        addressCity: addr?.city || "",
        addressState: addr?.state || "",
        addressPostalCode: addr?.postalCode || "",
        addressCountry: addr?.country || "India",
        baseCurrency: settings.baseCurrency,
        defaultGstRate: Number(settings.defaultGstRate),
        gstRegistered: settings.gstRegistered,
        makingChargeMode: settings.makingChargeMode,
        defaultMakingCharge: Number(settings.defaultMakingCharge),
        invoicePrefix: settings.invoicePrefix,
        invoiceNextSeq: settings.invoiceNextSeq,
        financialYearStartMonth: settings.financialYearStartMonth,
        defaultTemplateId: settings.defaultTemplateId || "classic",
        defaultPaymentMode: settings.defaultPaymentMode || "cash",
      });
    }
  }, [settings, reset]);

  // Metal Rate Form
  const {
    register: registerRate,
    handleSubmit: handleSubmitRate,
    reset: resetRate,
    control: rateControl,
    formState: { errors: rateErrors },
  } = useForm({
    resolver: zodResolver(MetalRateSchema),
    defaultValues: {
      metalType: MetalType.gold,
      purityFineness: "0.916",
    },
  });

  // useWatch is React Compiler-compatible; watch() from useForm() is not.
  const selectedMetalType = useWatch({ control: rateControl, name: "metalType" });
  const selectedTemplate = useWatch({ control, name: "defaultTemplateId" }) || "gold-classic-jewellers";

  const [templateStyle, setTemplateStyle] = React.useState<string>("all");
  const [templateSearch, setTemplateSearch] = React.useState<string>("");

  const sampleGoldInvoice = React.useMemo(() => createInitialInvoice("gold"), []);

  const filteredTemplates = React.useMemo(() => {
    return TEMPLATES.filter((t) => {
      let matchesStyle = true;
      if (templateStyle === "traditional") {
        matchesStyle = [
          "gold-classic-jewellers", "gold-royal-zari", "gold-vintage-ornate",
          "gold-temple-gold", "gold-heritage-palace", "gold-royal-maratha",
          "gold-nizam-hyderabad", "gold-bengal-karigari", "gold-bilingual-hindi"
        ].includes(t.id);
      } else if (templateStyle === "luxury") {
        matchesStyle = [
          "gold-modern-boutique", "gold-minimal-karat", "gold-rose-gold-chic",
          "gold-art-deco", "gold-sapphire-luxe", "gold-italian-chain",
          "gold-two-tone-duo", "gold-elite-concierge", "gold-contemporary-linear"
        ].includes(t.id);
      } else if (templateStyle === "bridal") {
        matchesStyle = [
          "gold-bridal-collection", "gold-diamond-solitaire", "gold-kundan-meenakari",
          "gold-polki-heritage", "gold-shree-ratna", "gold-festive-diwali",
          "gold-akshaya-tritiya", "gold-filigree-delicate", "gold-antique-matte",
          "gold-emerald-crest", "gold-nouveau-curves"
        ].includes(t.id);
      } else if (templateStyle === "bullion") {
        matchesStyle = [
          "gold-hallmark-ledger", "gold-bullion-simple", "gold-corporate-wholesale",
          "gold-pure-999", "gold-sovereign-vault", "gold-premium-signature",
          "gold-artisan-workshop"
        ].includes(t.id);
      } else if (templateStyle === "thermal") {
        matchesStyle = t.isThermal || ["gold-compact-counter", "gold-a5-voucher"].includes(t.id);
      }

      const matchesSearch =
        templateSearch.trim() === "" ||
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.paperSize.toLowerCase().includes(templateSearch.toLowerCase()) ||
        (t.badge && t.badge.toLowerCase().includes(templateSearch.toLowerCase()));
      return matchesStyle && matchesSearch;
    });
  }, [templateStyle, templateSearch]);

  const onSettingsSubmit = (values: BusinessSettingsFormValues) => {
    const addressPayload = values.addressStreet || values.addressCity
      ? {
          street: values.addressStreet || "",
          city: values.addressCity || "",
          state: values.addressState || "",
          postalCode: values.addressPostalCode || "",
          country: values.addressCountry || "India",
        }
      : null;

    updateSettings(
      {
        ...values,
        gstin: values.gstin || null,
        pan: values.pan || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
        defaultTemplateId: values.defaultTemplateId || "classic",
        address: addressPayload,
        defaultPaymentMode: values.defaultPaymentMode,
      },
      {
        onSuccess: () => {
          toast.success("Business settings updated successfully.");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update business settings.");
        },
      }
    );
  };

  const onMetalRateSubmit = (values: MetalRateFormValues) => {
    const todayStr = new Date().toISOString().split("T")[0];
    createRate(
      {
        metalType: values.metalType,
        purityFineness: values.purityFineness,
        ratePerGram: values.ratePerGram.toString(),
        rateDate: todayStr,
        source: values.source || "Manual",
      },
      {
        onSuccess: () => {
          toast.success("Metal rate recorded successfully.");
          resetRate({
            metalType: values.metalType,
            purityFineness: values.purityFineness,
            ratePerGram: 0,
            source: "",
          });
        },
        onError: (error) => {
          toast.error(error.message || "Failed to log metal rate.");
        },
      }
    );
  };

  if (settingsLoading || ratesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Configuration</h1>
        <p className="text-muted-foreground">Manage your jewellery enterprise profile, default GST rates, making charges, and daily metal prices.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <Coins className="h-4 w-4" />
            Daily Metal Rates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Card */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>Primary profile and legal registrations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Business Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gstin">GSTIN (Optional)</Label>
                      <Input id="gstin" placeholder="27AAAAA1111A1Z1" {...register("gstin")} />
                      {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pan">PAN (Optional)</Label>
                      <Input id="pan" placeholder="ABCDE1234F" {...register("pan")} />
                      {errors.pan && <p className="text-xs text-destructive">{errors.pan.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" placeholder="contact@jeweller.com" {...register("contactEmail")} />
                    {errors.contactEmail && <p className="text-xs text-destructive">{errors.contactEmail.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" placeholder="9876543210" {...register("contactPhone")} />
                    {errors.contactPhone && <p className="text-xs text-destructive">{errors.contactPhone.message}</p>}
                  </div>

                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Store Address (Invoices & Billing)</Label>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="addressStreet">Street Address</Label>
                      <Input id="addressStreet" placeholder="e.g. Shop No. 12, Zaveri Bazaar" {...register("addressStreet")} />
                      {errors.addressStreet && <p className="text-xs text-destructive">{errors.addressStreet.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="addressCity">City</Label>
                        <Input id="addressCity" placeholder="Mumbai" {...register("addressCity")} />
                        {errors.addressCity && <p className="text-xs text-destructive">{errors.addressCity.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="addressState">State</Label>
                        <Input id="addressState" placeholder="Maharashtra" {...register("addressState")} />
                        {errors.addressState && <p className="text-xs text-destructive">{errors.addressState.message}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="addressPostalCode">PIN / Postal Code</Label>
                        <Input id="addressPostalCode" placeholder="400002" {...register("addressPostalCode")} />
                        {errors.addressPostalCode && <p className="text-xs text-destructive">{errors.addressPostalCode.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="addressCountry">Country</Label>
                        <Input id="addressCountry" placeholder="India" {...register("addressCountry")} />
                        {errors.addressCountry && <p className="text-xs text-destructive">{errors.addressCountry.message}</p>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoicing Settings */}
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle>Invoicing & Sequence</CardTitle>
                  <CardDescription>Configure billing sequences and regional settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                      <Input id="invoicePrefix" {...register("invoicePrefix")} />
                      {errors.invoicePrefix && <p className="text-xs text-destructive">{errors.invoicePrefix.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="invoiceNextSeq">Next Sequence Number</Label>
                      <Input id="invoiceNextSeq" type="number" {...register("invoiceNextSeq")} />
                      {errors.invoiceNextSeq && <p className="text-xs text-destructive">{errors.invoiceNextSeq.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Select label="Base Currency" {...register("baseCurrency")}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                      </Select>
                      {errors.baseCurrency && <p className="text-xs text-destructive">{errors.baseCurrency.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Select label="Financial Year Start" {...register("financialYearStartMonth")}>
                        <option value="4">April (Standard India)</option>
                        <option value="1">January</option>
                      </Select>
                      {errors.financialYearStartMonth && <p className="text-xs text-destructive">{errors.financialYearStartMonth.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t">
                    <Select label="Default Counter Payment Mode" {...register("defaultPaymentMode")}>
                      <option value="cash">Cash (Full Settlement)</option>
                      <option value="upi">Online / UPI (Full Settlement)</option>
                      <option value="card">Card / POS Machine</option>
                      <option value="split">Split (Part Cash, Part Online)</option>
                      <option value="due">Credit / Due (Pay Later)</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Pre-selects this payment mode when staff creates a new bill.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Taxation & Default Charges */}
              <Card className="shadow-sm border md:col-span-2">
                <CardHeader>
                  <CardTitle>Default Pricing & Tax Configurations</CardTitle>
                  <CardDescription>Default policies applied automatically inside the billing POS engine.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Select label="Tax Registration" {...register("gstRegistered")}>
                        <option value="true">Registered (CGST/SGST/IGST Active)</option>
                        <option value="false">Unregistered / Exempt Composition Scheme</option>
                      </Select>
                      {errors.gstRegistered && <p className="text-xs text-destructive">{errors.gstRegistered.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="defaultGstRate">Default GST Percentage (%)</Label>
                      <Input id="defaultGstRate" type="number" step="0.01" {...register("defaultGstRate")} />
                      {errors.defaultGstRate && <p className="text-xs text-destructive">{errors.defaultGstRate.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Select label="Making Charge Mode" {...register("makingChargeMode")}>
                        <option value="per_gram">Per Gram (Weight based)</option>
                        <option value="percentage">Percentage (%) of Metal Value</option>
                        <option value="flat">Flat Charge per Piece</option>
                      </Select>
                      {errors.makingChargeMode && <p className="text-xs text-destructive">{errors.makingChargeMode.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="defaultMakingCharge">Default Making Charge (Rate / %)</Label>
                      <Input id="defaultMakingCharge" type="number" step="0.0001" {...register("defaultMakingCharge")} />
                      {errors.defaultMakingCharge && <p className="text-xs text-destructive">{errors.defaultMakingCharge.message}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Layout Templates Gallery (40 Gold Designs) */}
              <Card className="shadow-sm border md:col-span-2">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <LayoutGrid className="size-5 text-primary" />
                      Gold Jewellery Invoice Templates ({TEMPLATES.length} Designs)
                    </CardTitle>
                    <CardDescription>
                      Choose your default store bill template. Fully compliant with BIS Hallmarking, HUID codes, GST 3%, and old gold exchange.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Search 40 gold templates..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Style filter pills */}
                  <div className="flex flex-wrap items-center gap-2 pb-2">
                    {[
                      { id: "all", label: "All Gold Designs (40)" },
                      { id: "traditional", label: "Traditional & Royal" },
                      { id: "luxury", label: "Modern & Luxury" },
                      { id: "bridal", label: "Bridal & Artisan" },
                      { id: "bullion", label: "Bullion & Certified" },
                      { id: "thermal", label: "Counter & POS Thermal" },
                    ].map((pill) => (
                      <Button
                        key={pill.id}
                        type="button"
                        variant={templateStyle === pill.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTemplateStyle(pill.id)}
                        className="text-xs h-8"
                      >
                        {pill.label}
                      </Button>
                    ))}
                  </div>

                  {/* Template Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[680px] overflow-y-auto p-1">
                    {filteredTemplates.map((t) => {
                      const isSelected =
                        selectedTemplate === t.id ||
                        (selectedTemplate === "classic" && t.id === "gold-classic-jewellers");
                      return (
                        <TemplateThumbnail
                          key={t.id}
                          template={t}
                          invoice={sampleGoldInvoice}
                          isSelected={isSelected}
                          onSelect={(id) => setValue("defaultTemplateId", id, { shouldDirty: true })}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={settingsUpdating} className="gap-2">
                {settingsUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Configurations
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="rates">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Create Metal Rate Card */}
            <Card className="md:col-span-1 shadow-sm border h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Log Today&apos;s Rate
                </CardTitle>
                <CardDescription>Record daily metal gold/silver spot pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRate(onMetalRateSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Select label="Metal Type" {...registerRate("metalType")}>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="platinum">Platinum</option>
                    </Select>
                    {rateErrors.metalType && <p className="text-xs text-destructive">{rateErrors.metalType.message}</p>}
                  </div>
                  
                  {selectedMetalType !== "platinum" && (
                    <div className="space-y-1.5">
                      <Select label="Purity Fineness" {...registerRate("purityFineness")}>
                        {selectedMetalType === "gold" ? (
                          <>
                            <option value="0.999">24K (999 Fineness)</option>
                            <option value="0.916">22K (916 Fineness)</option>
                            <option value="0.750">18K (750 Fineness)</option>
                            <option value="0.585">14K (585 Fineness)</option>
                          </>
                        ) : (
                          <>
                            <option value="0.999">Fine Silver (999)</option>
                            <option value="0.925">Sterling Silver (925)</option>
                          </>
                        )}
                      </Select>
                      {rateErrors.purityFineness && <p className="text-xs text-destructive">{rateErrors.purityFineness.message}</p>}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="ratePerGram">Rate Per Gram (INR)</Label>
                    <Input id="ratePerGram" type="number" step="0.01" {...registerRate("ratePerGram")} />
                    {rateErrors.ratePerGram && <p className="text-xs text-destructive">{rateErrors.ratePerGram.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="source">Rate Source (Optional)</Label>
                    <Input id="source" placeholder="IBJA / Spot Exchange" {...registerRate("source")} />
                    {rateErrors.source && <p className="text-xs text-destructive">{rateErrors.source.message}</p>}
                  </div>

                  <Button type="submit" disabled={rateCreating} className="w-full gap-2">
                    {rateCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Record Spot Rate
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List Metal Rates Table */}
            <Card className="md:col-span-2 shadow-sm border">
              <CardHeader>
                <CardTitle>Historical Price Logs</CardTitle>
                <CardDescription>Track logged metal prices for reference in billing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Metal</TableHead>
                      <TableHead>Purity</TableHead>
                      <TableHead className="text-right">Rate/Gram</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates && rates.length > 0 ? (
                      rates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="font-medium">
                            {new Date(rate.rateDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </TableCell>
                          <TableCell className="capitalize">{rate.metalType}</TableCell>
                          <TableCell>
                            {rate.purityFineness 
                              ? `${parseFloat(rate.purityFineness.toString()) * 24}K (${parseFloat(rate.purityFineness.toString()) * 1000})`
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatINR(rate.ratePerGram.toString())}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{rate.source || "Manual"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                          No price logs recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
