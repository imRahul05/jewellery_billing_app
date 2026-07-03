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
import { Coins, Loader2, Save, Settings2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { MetalType } from "@prisma/client";

const BusinessSettingsSchema = z.object({
  name: z.string().min(1, "Business Name is required"),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  pan: z.string().length(10, "PAN must be 10 characters").or(z.literal("")).nullable(),
  contactEmail: z.string().email("Invalid email").or(z.literal("")).nullable(),
  contactPhone: z.string().min(10, "Phone must be at least 10 digits").or(z.literal("")).nullable(),
  baseCurrency: z.string().length(3),
  defaultGstRate: z.coerce.number().nonnegative("GST rate must be non-negative"),
  gstRegistered: z.coerce.boolean(),
  makingChargeMode: z.string(),
  defaultMakingCharge: z.coerce.number().nonnegative("Making charge must be non-negative"),
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  invoiceNextSeq: z.coerce.string().min(1, "Next sequence is required"),
  financialYearStartMonth: z.coerce.number().int().min(1).max(12),
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(BusinessSettingsSchema),
  });

  // Reset form when settings load
  React.useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        gstin: settings.gstin || "",
        pan: settings.pan || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        baseCurrency: settings.baseCurrency,
        defaultGstRate: Number(settings.defaultGstRate),
        gstRegistered: settings.gstRegistered,
        makingChargeMode: settings.makingChargeMode,
        defaultMakingCharge: Number(settings.defaultMakingCharge),
        invoicePrefix: settings.invoicePrefix,
        invoiceNextSeq: settings.invoiceNextSeq,
        financialYearStartMonth: settings.financialYearStartMonth,
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

  const onSettingsSubmit = (values: BusinessSettingsFormValues) => {
    updateSettings(
      {
        ...values,
        gstin: values.gstin || null,
        pan: values.pan || null,
        contactEmail: values.contactEmail || null,
        contactPhone: values.contactPhone || null,
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
