"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useCustomers, useCreateCustomer } from "@/lib/query/hooks/use-customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { Loader2, Plus, Search, User, UserPlus } from "lucide-react";
import { toast } from "sonner";

const AddCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").or(z.literal("")).nullable(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable(),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  address: z.string().or(z.literal("")).nullable(),
  openingBalance: z.number().nonnegative("Opening balance must be non-negative"),
  notes: z.string().optional().nullable(),
});

type AddCustomerFormValues = z.infer<typeof AddCustomerSchema>;

export default function CustomersPage() {
  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Queries & Mutations
  const { data: customers, isLoading } = useCustomers(tId, { search: searchQuery });
  const { mutate: createCustomer, isPending: creating } = useCreateCustomer(tId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AddCustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      gstin: "",
      address: "",
      openingBalance: 0,
      notes: "",
    },
  });

  const onSubmit = (values: AddCustomerFormValues) => {
    createCustomer(
      {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        gstin: values.gstin || undefined,
        addressJson: values.address ? { street: values.address } : undefined,
        openingBalance: values.openingBalance.toString(),
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Customer created successfully.");
          setDialogOpen(false);
          reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create customer.");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Directory</h1>
          <p className="text-muted-foreground">Manage your client registry, credit balances, and KYC parameters.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Register New Customer
              </DialogTitle>
              <DialogDescription>Create a client master file to link invoices and ledger tracking.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Rahul Sharma" {...register("name")} />
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
                  <Input id="email" type="email" placeholder="rahul@domain.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN (Optional B2B)</Label>
                <Input id="gstin" placeholder="27AAAAA1111A1Z1" {...register("gstin")} />
                {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Flat, Street, Area" {...register("address")} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="openingBalance">Opening Ledger Balance (INR Dues)</Label>
                <Input id="openingBalance" type="number" step="0.01" {...register("openingBalance", { valueAsNumber: true })} />
                {errors.openingBalance && <p className="text-xs text-destructive">{errors.openingBalance.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal Remarks</Label>
                <Input id="notes" placeholder="e.g. VIP client, references..." {...register("notes")} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="gap-2">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Register Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Toolbar / Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => (
                  <TableRow key={cust.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link href={`/customers/${cust.id}`} className="hover:text-primary transition-colors flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="size-3.5" />
                        </span>
                        {cust.name}
                      </Link>
                    </TableCell>
                    <TableCell>{cust.phone || <span className="text-muted-foreground/60">—</span>}</TableCell>
                    <TableCell>{cust.email || <span className="text-muted-foreground/60">—</span>}</TableCell>
                    <TableCell>
                      {cust.gstin ? (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {cust.gstin}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatINR(cust.openingBalance.toString())}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/customers/${cust.id}`}>
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
              <User className="h-8 w-8 text-muted-foreground/60 mb-1" />
              <p className="font-medium">No customers registered yet</p>
              <p className="text-xs">Create a new customer using the button above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
