"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useSupplierDetail, useUpdateSupplier, useDeleteSupplier } from "@/lib/query/hooks/use-suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/format";
import { ArrowLeft, BookOpen, Calendar, Edit2, Loader2, Save, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const EditSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").or(z.literal("")).nullable(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable(),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).nullable(),
  address: z.string().or(z.literal("")).nullable(),
});

type EditSupplierFormValues = z.infer<typeof EditSupplierSchema>;

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  const [isEditing, setIsEditing] = React.useState(false);

  // Queries
  const { data: supplier, isLoading: detailLoading } = useSupplierDetail(tId, id);

  // Mutations
  const { mutate: updateSupplier, isPending: updating } = useUpdateSupplier(tId, id);
  const { mutate: deleteSupplier, isPending: deleting } = useDeleteSupplier(tId, id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(EditSupplierSchema),
  });

  // Populate form
  React.useEffect(() => {
    if (supplier) {
      const addressObj = supplier.addressJson as { street?: string } | null;
      reset({
        name: supplier.name,
        phone: supplier.phone || "",
        email: supplier.email || "",
        gstin: supplier.gstin || "",
        address: addressObj?.street || "",
      });
    }
  }, [supplier, reset]);

  const onUpdateSubmit = (values: EditSupplierFormValues) => {
    updateSupplier(
      {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        gstin: values.gstin || undefined,
        addressJson: values.address ? { street: values.address } : null,
      },
      {
        onSuccess: () => {
          toast.success("Supplier profile updated successfully.");
          setIsEditing(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update vendor.");
        },
      }
    );
  };

  const onDeleteClick = () => {
    if (confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      deleteSupplier(undefined, {
        onSuccess: () => {
          toast.success("Supplier record archived.");
          router.push("/suppliers");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to archive vendor.");
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

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Supplier record not found.</p>
        <Link href="/suppliers" className="text-primary hover:underline mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          <p className="text-xs text-muted-foreground">Vendor profile registered on {new Date(supplier.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 shadow-sm border h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-md flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              Vendor Profile
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
                  <Label htmlFor="editName">Supplier/Firm Name</Label>
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
                  <span className="font-medium text-right">{supplier.phone || "—"}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-right break-all">{supplier.email || "—"}</span>
                  <span className="text-muted-foreground">GSTIN:</span>
                  <span className="font-mono text-xs font-semibold text-right">{supplier.gstin || "—"}</span>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-right text-xs">
                    {(supplier.addressJson as { street?: string } | null)?.street || "—"}
                  </span>
                </div>
                <div className="space-y-2 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Opening Balance:</span>
                    <span className="font-semibold text-destructive">{formatINR(supplier.openingBalance.toString())}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ledger & Transactions Placeholder Tabs */}
        <Card className="md:col-span-2 shadow-sm border">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="ledger">
              <TabsList className="mb-4">
                <TabsTrigger value="ledger" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Vendor Purchases
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ledger">
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                  <Calendar className="h-6 w-6 mb-2 text-muted-foreground/50" />
                  <p className="font-medium">No wholesale purchase logs found</p>
                  <p className="text-xs">Incoming metal purchases linked to inventory intake will display here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
