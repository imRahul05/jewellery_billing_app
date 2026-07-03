"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/query/keys";
import { supplierApi } from "@/lib/api/supplier.api";
import { useCreateSupplier } from "@/lib/query/hooks/use-suppliers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { Loader2, Plus, Search, Truck, UserPlus } from "lucide-react";
import { toast } from "sonner";

export interface SerializedSupplier {
  id: string;
  tenantId: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  addressJson: unknown;
  openingBalance: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const AddSupplierSchema = z.object({
  name: z.string().min(1, "Supplier Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").or(z.literal("")).nullable(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable(),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  address: z.string().or(z.literal("")).nullable(),
  openingBalance: z.coerce.number().nonnegative("Opening balance must be non-negative"),
});

type AddSupplierFormValues = z.infer<typeof AddSupplierSchema>;

interface SuppliersClientWrapperProps {
  tenantId: string;
  initialSuppliers: SerializedSupplier[];
}

export function SuppliersClientWrapper({
  tenantId,
  initialSuppliers,
}: SuppliersClientWrapperProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query parameter for search term
  const searchParam = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = React.useState(searchParam);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Sync React Query with the Server-Side data and local cache
  const { data: suppliers, isLoading } = useQuery({
    queryKey: qk.suppliers.list(tenantId, searchParam),
    queryFn: async () => {
      const res = await supplierApi.getSuppliers({ search: searchParam });
      // Map to SerializedSupplier
      return res.data.map((s) => ({
        ...s,
        openingBalance: s.openingBalance.toString(),
        createdAt: new Date(s.createdAt).toISOString(),
        updatedAt: new Date(s.updatedAt).toISOString(),
        deletedAt: s.deletedAt ? new Date(s.deletedAt).toISOString() : null,
      }));
    },
    initialData: initialSuppliers,
    enabled: Boolean(tenantId),
  });

  const { mutate: createSupplier, isPending: creating } = useCreateSupplier(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddSupplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      gstin: "",
      address: "",
      openingBalance: 0,
    },
  });

  // Debounced URL sync when search input updates
  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      router.push(`/suppliers?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, router, searchParams]);

  const onSubmit = (values: AddSupplierFormValues) => {
    createSupplier(
      {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        gstin: values.gstin || undefined,
        addressJson: values.address ? { street: values.address } : undefined,
        openingBalance: values.openingBalance.toString(),
      },
      {
        onSuccess: () => {
          toast.success("Supplier registered successfully.");
          setDialogOpen(false);
          reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to register supplier.");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers Directory</h1>
          <p className="text-muted-foreground">Manage your wholesale supply vendors, purchase credits, and invoice ledgers.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Register New Supplier
              </DialogTitle>
              <DialogDescription>Create a vendor master file to log metal purchase inflows and invoices.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Supplier Name / Firm Name</Label>
                <Input id="name" placeholder="Shree Balaji Bullion" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="9876543210" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="sales@vendor.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
                <Input id="gstin" placeholder="27AAAAA1111A1Z1" {...register("gstin")} />
                {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Vendor Office Address" {...register("address")} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="openingBalance">Opening Ledger Balance (INR Payables)</Label>
                <Input id="openingBalance" type="number" step="0.01" {...register("openingBalance")} />
                {errors.openingBalance && <p className="text-xs text-destructive">{errors.openingBalance.message}</p>}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Supplier
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search suppliers by name or phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Directory Table */}
      <Card className="shadow-sm border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-36 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier / Firm</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Opening Payable</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((sup) => (
                  <TableRow key={sup.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link href={`/suppliers/${sup.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Truck className="size-3.5" />
                        </span>
                        {sup.name}
                      </Link>
                    </TableCell>
                    <TableCell>{sup.phone || <span className="text-muted-foreground/60">—</span>}</TableCell>
                    <TableCell>{sup.email || <span className="text-muted-foreground/60">—</span>}</TableCell>
                    <TableCell>
                      {sup.gstin ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {sup.gstin}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-destructive">
                      {formatINR(sup.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/suppliers/${sup.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-1">
              <Truck className="h-8 w-8 text-muted-foreground/60 mb-1" />
              <p className="font-medium">No suppliers registered yet</p>
              <p className="text-xs">Create a new vendor profile using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
