"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useCustomerDetail, useCustomerLedger, useUpdateCustomer, useDeleteCustomer } from "@/lib/query/hooks/use-customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/format";
import { ArrowLeft, BookOpen, Calendar, Edit2, Loader2, Save, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const EditCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").or(z.literal("")).nullable(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable(),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  address: z.string().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
});

type EditCustomerFormValues = z.infer<typeof EditCustomerSchema>;

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  const [isEditing, setIsEditing] = React.useState(false);

  // Queries
  const { data: customer, isLoading: detailLoading } = useCustomerDetail(tId, id);
  const { data: ledger, isLoading: ledgerLoading } = useCustomerLedger(tId, id);

  // Mutations
  const { mutate: updateCustomer, isPending: updating } = useUpdateCustomer(tId, id);
  const { mutate: deleteCustomer, isPending: deleting } = useDeleteCustomer(tId, id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditCustomerSchema),
  });

  // Populate form
  React.useEffect(() => {
    if (customer) {
      const addressObj = customer.addressJson as { street?: string } | null;
      reset({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        gstin: customer.gstin || "",
        address: addressObj?.street || "",
        notes: customer.notes || "",
      });
    }
  }, [customer, reset]);

  const onUpdateSubmit = (values: EditCustomerFormValues) => {
    updateCustomer(
      {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        gstin: values.gstin || undefined,
        addressJson: values.address ? { street: values.address } : undefined,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Customer profile updated successfully.");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update profile.");
        },
      }
    );
  };

  const onDeleteClick = () => {
    if (confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      deleteCustomer(undefined, {
        onSuccess: () => {
          toast.success("Customer record archived.");
          router.push("/customers");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive customer.");
        },
      });
    }
  };

  if (detailLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer record not found.</p>
        <Link href="/customers" className="text-primary hover:underline mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-xs text-muted-foreground">Registered on {new Date(customer.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Details Sheet */}
        <Card className="md:col-span-1 shadow-sm border h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Client Profile
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8"
            >
              {isEditing ? "Cancel" : <Edit2 className="h-3.5 w-3.5" />}
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {isEditing ? (
              <form onSubmit={handleSubmit(onUpdateSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editName">Full Name</Label>
                  <Input id="editName" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editPhone">Phone Number</Label>
                  <Input id="editPhone" {...register("phone")} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input id="editEmail" type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editGstin">GSTIN</Label>
                  <Input id="editGstin" {...register("gstin")} />
                  {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editAddress">Address</Label>
                  <Input id="editAddress" {...register("address")} />
                  {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editNotes">Remarks</Label>
                  <Input id="editNotes" {...register("notes")} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={updating} className="w-full gap-1.5">
                    {updating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Details
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={onDeleteClick}
                    className="p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-b pb-4">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium text-right">{customer.phone || "—"}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-right break-all">{customer.email || "—"}</span>
                  <span className="text-muted-foreground">GSTIN:</span>
                  <span className="font-mono text-xs font-semibold text-right">{customer.gstin || "—"}</span>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-right text-xs">
                    {(customer.addressJson as { street?: string } | null)?.street || "—"}
                  </span>
                </div>
                <div className="space-y-2 border-b pb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Opening Balance:</span>
                    <span className="font-semibold">{formatINR(customer.openingBalance.toString())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Loyalty Points:</span>
                    <span className="font-semibold text-amber-600">{customer.loyaltyPoints} pts</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Remarks</h4>
                  <p className="text-sm bg-muted/30 p-2.5 rounded border border-muted/50 text-muted-foreground text-xs italic">
                    {customer.notes || "No notes logged for this customer."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ledger & Transactions Tabs */}
        <Card className="md:col-span-2 shadow-sm border">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="ledger">
              <TabsList className="mb-4">
                <TabsTrigger value="ledger" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Client Ledger
                </TabsTrigger>
                <TabsTrigger value="purchases" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Purchase History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ledger">
                {ledgerLoading ? (
                  <div className="flex h-36 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : ledger && ledger.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Transaction Amount</TableHead>
                        <TableHead className="text-right">Running Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Starting balance row */}
                      <TableRow className="bg-muted/10 italic text-muted-foreground">
                        <TableCell>—</TableCell>
                        <TableCell>Opening balance</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatINR(customer.openingBalance.toString())}
                        </TableCell>
                      </TableRow>
                      {ledger.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-xs">
                            {new Date(entry.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              timeZone: "UTC",
                            })}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{entry.description}</TableCell>
                          <TableCell
                            className={`text-right font-mono text-xs font-semibold ${
                              entry.type === "invoice" ? "text-destructive" : "text-success"
                            }`}
                          >
                            {entry.type === "invoice" ? "+" : ""}
                            {formatINR(entry.amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {formatINR(entry.balanceAfter)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                    <BookOpen className="h-6 w-6 mb-2 text-muted-foreground/50" />
                    <p className="font-medium">No ledger records found</p>
                    <p className="text-xs">Ledger updates automatically as invoices and payments are logged.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases">
                {ledgerLoading ? (
                  <div className="flex h-36 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : ledger && ledger.filter(e => e.type === "invoice").length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Grand Total</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger
                        .filter((e) => e.type === "invoice")
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-xs">
                              {new Date(entry.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="font-semibold text-xs">{entry.description}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-destructive">
                              {formatINR(entry.amount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/billing/${entry.id}`}>
                                <Button variant="outline" size="sm" className="h-7 text-xs">
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                    <Calendar className="h-6 w-6 mb-2 text-muted-foreground/50" />
                    <p className="font-medium">No purchase invoices found</p>
                    <p className="text-xs">Billing invoices created will appear in this log.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
