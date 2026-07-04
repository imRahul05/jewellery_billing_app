"use client";

import { useEffect, useState } from "react";
import { adminApi, type PlatformPlan } from "@/lib/api/admin.api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Edit2, Gem, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function PlansPage() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlatformPlan | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [priceMonthly, setPriceMonthly] = useState(0);
  const [priceYearly, setPriceYearly] = useState(0);
  const [maxUsers, setMaxUsers] = useState<number | "">("");
  const [maxInvoicesMonthly, setMaxInvoicesMonthly] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPlans = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminApi.listPlans();
      setPlans(res.data);
    } catch {
      toast.error("Failed to load plans directory");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function fetchPlans() {
      try {
        const res = await adminApi.listPlans();
        if (active) {
          setPlans(res.data);
        }
      } catch {
        toast.error("Failed to load plans directory");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    fetchPlans();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenDialog = (plan?: PlatformPlan) => {
    if (plan) {
      setSelectedPlan(plan);
      setName(plan.name);
      setCode(plan.code);
      setPriceMonthly(Number(plan.priceMonthly));
      setPriceYearly(Number(plan.priceYearly));
      setMaxUsers(plan.maxUsers !== null ? plan.maxUsers : "");
      setMaxInvoicesMonthly(plan.maxInvoicesMonthly !== null ? plan.maxInvoicesMonthly : "");
      setIsActive(plan.isActive);
    } else {
      setSelectedPlan(null);
      setName("");
      setCode("");
      setPriceMonthly(0);
      setPriceYearly(0);
      setMaxUsers("");
      setMaxInvoicesMonthly("");
      setIsActive(true);
    }
    setIsOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error("Name and Code are required");
      return;
    }
    setIsSaving(true);
    try {
      await adminApi.savePlan({
        id: selectedPlan?.id,
        name,
        code,
        priceMonthly,
        priceYearly,
        maxUsers: maxUsers === "" ? null : Number(maxUsers),
        maxInvoicesMonthly: maxInvoicesMonthly === "" ? null : Number(maxInvoicesMonthly),
        isActive,
      });
      toast.success(selectedPlan ? "Plan updated successfully" : "Plan created successfully");
      setIsOpen(false);
      loadPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save plan details";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground text-sm">
            Define pricing tiers, limits, and feature permissions for tenant businesses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPlans} disabled={isRefreshing}>
            <RefreshCw className={`size-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="size-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground font-mono">
          LOADING_SUBSCRIPTION_PLANS...
        </div>
      ) : plans.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed rounded-lg">
          <Gem className="size-8 text-muted-foreground/50" />
          <p className="font-semibold text-muted-foreground">No plans defined.</p>
          <p className="text-xs text-muted-foreground/75">Create your first subscription tier to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className={`flex flex-col relative border ${!p.isActive ? "opacity-60 bg-muted/20" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-950 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                    {p.code}
                  </span>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => handleOpenDialog(p)}>
                    <Edit2 className="size-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl font-bold mt-2">{p.name}</CardTitle>
                <CardDescription>
                  Monthly: ₹{Number(p.priceMonthly).toLocaleString()} | Yearly: ₹{Number(p.priceYearly).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-2 pb-6">
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Max Staff Users</span>
                    <span className="font-bold">{p.maxUsers !== null ? p.maxUsers : "Unlimited"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Monthly Invoices</span>
                    <span className="font-bold">{p.maxInvoicesMonthly !== null ? p.maxInvoicesMonthly : "Unlimited"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold ${p.isActive ? "text-emerald-500" : "text-destructive"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Features Included</div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>GST Invoices & Estimates</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Inventory & Stock Ledger</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Reporting & Recharts Analytics</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSavePlan} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{selectedPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</DialogTitle>
              <DialogDescription>
                Configure pricing, limits, and identifiers for the plan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 text-xs">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  className="col-span-3 h-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Starter Plan"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">Code</Label>
                <Input
                  id="code"
                  className="col-span-3 h-8 uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="STARTER"
                  disabled={selectedPlan !== null}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price-monthly" className="text-right">Price Monthly (₹)</Label>
                <Input
                  id="price-monthly"
                  type="number"
                  className="col-span-3 h-8"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price-yearly" className="text-right">Price Yearly (₹)</Label>
                <Input
                  id="price-yearly"
                  type="number"
                  className="col-span-3 h-8"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-users" className="text-right">Max Users</Label>
                <Input
                  id="max-users"
                  type="number"
                  className="col-span-3 h-8"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Unlimited"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="max-invoices" className="text-right">Max Invoices/mo</Label>
                <Input
                  id="max-invoices"
                  type="number"
                  className="col-span-3 h-8"
                  value={maxInvoicesMonthly}
                  onChange={(e) => setMaxInvoicesMonthly(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Unlimited"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">Active Status</Label>
                <div className="col-span-3 flex items-center h-8">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {isActive ? "Tenants can subscribe to this plan" : "Plan hidden from onboarding / billing"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
