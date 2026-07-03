"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
import { metalRateApi, MetalRateInput } from "@/lib/api/metal-rates.api";
import { SerializedMetalRate } from "@/app/api/v1/metal-rates/route";
import { MetalType } from "@prisma/client";

export default function MetalRatesPage(): React.JSX.Element {
  const [rates, setRates] = useState<SerializedMetalRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [metalType, setMetalType] = useState<MetalType>("gold");
  const [purityFineness, setPurityFineness] = useState<string>("0.916");
  const [ratePerGram, setRatePerGram] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const loadRates = async (): Promise<void> => {
      try {
        setLoading(true);
        const res = await metalRateApi.getMetalRates();
        if (active) {
          setRates(res.data);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to load metal rates";
          toast.error(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void loadRates();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const fetchRates = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!ratePerGram || isNaN(parseFloat(ratePerGram))) {
      toast.error("Please enter a valid rate per gram.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: MetalRateInput = {
        metalType,
        purityFineness: purityFineness || null,
        rateDate: new Date(),
        ratePerGram: parseFloat(ratePerGram),
        source: source || null,
      };

      await metalRateApi.createMetalRate(payload);
      toast.success("Metal rate updated successfully for today!");
      setRatePerGram("");
      setSource("");
      void fetchRates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update metal rate";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
            Metal Rate Management
          </h1>
          <p className="text-muted-foreground">
            Configure and monitor today&apos;s spot rates for gold, silver, and platinum.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spot Rate Entry Card */}
        <div className="lg:col-span-1">
          <Can permission="metal_rate:write">
            <Card className="border-amber-100/40 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-amber-500 font-bold">Update Daily Rate</CardTitle>
                <CardDescription>Set the pricing for walk-in billing and inventory valuation.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metal-type">Metal Type</Label>
                    <Select id="metal-type" value={metalType} onChange={(e) => setMetalType(e.target.value as MetalType)}>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="platinum">Platinum</option>
                      <option value="diamond">Diamond</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purity">Purity (Fineness)</Label>
                    <Select id="purity" value={purityFineness} onChange={(e) => setPurityFineness(e.target.value)}>
                      <option value="0.999">24K Gold (0.999)</option>
                      <option value="0.916">22K Gold (0.916)</option>
                      <option value="0.750">18K Gold (0.750)</option>
                      <option value="0.585">14K Gold (0.585)</option>
                      <option value="0.995">Fine Gold (0.995)</option>
                      <option value="0.925">Sterling Silver (0.925)</option>
                      <option value="0.950">Platinum 950 (0.950)</option>
                      <option value="">Other / No Purity</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate per Gram (INR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 7150.00"
                        className="pl-7"
                        value={ratePerGram}
                        onChange={(e) => setRatePerGram(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Rate Source (Optional)</Label>
                    <Input
                      id="source"
                      placeholder="e.g. MCX Spot, IBJA Rates"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-medium hover:from-amber-600 hover:to-yellow-700" disabled={submitting}>
                    {submitting ? "Updating..." : "Save Today's Rate"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Can>
        </div>

        {/* Rates History Table */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rate History</CardTitle>
                <CardDescription>Logged metal rates for today and past dates.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void fetchRates()} disabled={loading}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <span className="text-muted-foreground animate-pulse">Loading rates...</span>
                </div>
              ) : rates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-muted/20 rounded-lg p-4">
                  <p className="text-muted-foreground">No metal rates recorded yet.</p>
                </div>
              ) : (
                <div className="relative overflow-x-auto rounded-lg border border-muted/25">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Metal</TableHead>
                        <TableHead>Purity</TableHead>
                        <TableHead className="text-right">Rate / Gram</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((rate) => (
                        <TableRow key={rate.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="font-medium">{rate.rateDate}</TableCell>
                          <TableCell className="capitalize">{rate.metalType}</TableCell>
                          <TableCell>{rate.purityFineness ? `${parseFloat(rate.purityFineness) * 1000} fine` : "N/A"}</TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">₹{parseFloat(rate.ratePerGram).toFixed(2)}</TableCell>
                          <TableCell>{rate.source || "Manual Entry"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
