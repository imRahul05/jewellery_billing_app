"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useTenantStore } from "@/lib/stores/tenant-store";
import { useCategories, useCreateCategory, useProducts, useCreateProduct } from "@/lib/query/hooks/use-inventory-catalogue";
import { useInventoryItems, useCreateInventoryItem, useUploadAsset } from "@/lib/query/hooks/use-inventory-items";
import { useSuppliers } from "@/lib/query/hooks/use-suppliers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatINR, formatWeight } from "@/lib/format";
import { Boxes, FolderPlus, Gem, Layers, Loader2, Plus, Search, Tag, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { MetalType } from "@prisma/client";

// Zod schemas for dialog creation forms
const AddCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType).optional().nullable(),
});

type AddCategoryFormValues = z.infer<typeof AddCategorySchema>;

const AddProductSchema = z.object({
  sku: z.string().min(1, "SKU reference is required"),
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType),
  defaultPurity: z.coerce.number().optional().nullable(),
  defaultKarat: z.coerce.number().int().optional().nullable(),
  makingChargeMode: z.string().optional().nullable(),
  makingChargeValue: z.coerce.number().optional().nullable(),
});

type AddProductFormValues = z.infer<typeof AddProductSchema>;

const AddItemSchema = z.object({
  productId: z.string().min(1, "Product SKU is required"),
  supplierId: z.string().optional().nullable(),
  tagNumber: z.string().optional().nullable(),
  grossWeight: z.coerce.number().positive("Gross weight must be greater than 0"),
  netWeight: z.coerce.number().positive("Net weight must be greater than 0"),
  stoneWeight: z.coerce.number().nonnegative().default(0),
  wastagePercent: z.coerce.number().nonnegative().default(0),
  purityFineness: z.coerce.number().positive("Purity fineness must be greater than 0"),
  karat: z.coerce.number().int().optional().nullable(),
  quantity: z.coerce.number().int().positive().default(1),
  location: z.string().optional().nullable(),
  costPrice: z.coerce.number().nonnegative().default(0),
  status: z.string().default("in_stock"),
});

type AddItemFormValues = z.infer<typeof AddItemSchema>;

export default function InventoryDashboard() {
  const { tenantId } = useTenantStore();
  const tId = tenantId || "";

  // Active tabs & filters
  const [activeTab, setActiveTab] = React.useState("items");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  // Modals visibility state
  const [categoryModal, setCategoryModal] = React.useState(false);
  const [productModal, setProductModal] = React.useState(false);
  const [itemModal, setItemModal] = React.useState(false);

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useCategories(tId);
  const { data: products, isLoading: productsLoading } = useProducts(tId);
  const { data: items, isLoading: itemsLoading } = useInventoryItems(tId, { search: searchQuery, status: statusFilter });
  const { data: suppliers } = useSuppliers(tId);

  // Mutations
  const { mutate: createCategory, isPending: categoryCreating } = useCreateCategory(tId);
  const { mutate: createProduct, isPending: productCreating } = useCreateProduct(tId);
  const { mutate: createItem, isPending: itemCreating } = useCreateInventoryItem(tId);
  const { mutate: uploadAsset, isPending: assetUploading } = useUploadAsset();

  const [uploadedImageAssetId, setUploadedImageAssetId] = React.useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string | null>(null);

  // Category Form
  const categoryForm = useForm({
    resolver: zodResolver(AddCategorySchema),
  });

  // Product Form
  const productForm = useForm({
    resolver: zodResolver(AddProductSchema),
  });

  // Stock Item Form
  const itemForm = useForm({
    resolver: zodResolver(AddItemSchema),
  });

  const onCategorySubmit = (values: AddCategoryFormValues) => {
    createCategory(
      {
        name: values.name,
        parentId: values.parentId || null,
        metalType: values.metalType || null,
      },
      {
        onSuccess: () => {
          toast.success("Category created successfully.");
          setCategoryModal(false);
          categoryForm.reset();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create category.");
        },
      }
    );
  };

  const onProductSubmit = (values: AddProductFormValues) => {
    createProduct(
      {
        sku: values.sku,
        name: values.name,
        categoryId: values.categoryId || null,
        metalType: values.metalType,
        defaultPurity: values.defaultPurity ? values.defaultPurity.toString() : undefined,
        defaultKarat: values.defaultKarat || undefined,
        makingChargeMode: values.makingChargeMode || undefined,
        makingChargeValue: values.makingChargeValue ? values.makingChargeValue.toString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Product SKU registered successfully.");
          setProductModal(false);
          productForm.reset();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to register SKU design.");
        },
      }
    );
  };

  const onItemSubmit = (values: AddItemFormValues) => {
    // Math validation: grossWeight >= netWeight + stoneWeight
    if (values.grossWeight < (values.netWeight + values.stoneWeight)) {
      toast.error("Gross weight must be greater than or equal to net weight + stone weight.");
      return;
    }

    createItem(
      {
        productId: values.productId,
        supplierId: values.supplierId || null,
        tagNumber: values.tagNumber || null,
        grossWeight: values.grossWeight.toString(),
        netWeight: values.netWeight.toString(),
        stoneWeight: values.stoneWeight.toString(),
        wastagePercent: values.wastagePercent.toString(),
        purityFineness: values.purityFineness.toString(),
        karat: values.karat || undefined,
        quantity: values.quantity,
        location: values.location || undefined,
        costPrice: values.costPrice.toString(),
        status: values.status,
        imageAssetId: uploadedImageAssetId,
      },
      {
        onSuccess: () => {
          toast.success("Stock item added to inventory.");
          setItemModal(false);
          setUploadedImageAssetId(null);
          setImagePreviewUrl(null);
          itemForm.reset();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to add stock item.");
        },
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    setImagePreviewUrl(URL.createObjectURL(file));

    // Upload to pre-signed URL endpoint
    uploadAsset(
      { file, purpose: "item_image" },
      {
        onSuccess: (data) => {
          setUploadedImageAssetId(data.assetId);
          toast.success("Image uploaded successfully.");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to upload image.");
        },
      }
    );
  };

  // Watch product type in stock item form to auto-fill purities
  // useWatch is React Compiler-compatible; watch() from useForm() is not.
  const watchedProductId = useWatch({ control: itemForm.control, name: "productId" });
  React.useEffect(() => {
    if (watchedProductId && products) {
      const selectedProd = products.find((p) => p.id === watchedProductId);
      if (selectedProd) {
        itemForm.setValue("purityFineness", selectedProd.defaultPurity ? Number(selectedProd.defaultPurity) : 0.916);
        itemForm.setValue("karat", selectedProd.defaultKarat || 22);
      }
    }
  }, [watchedProductId, products, itemForm]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Centre</h1>
          <p className="text-muted-foreground">Manage nested categories, product catalogues, and unique tagged/bulk stock items.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Add Category Dialog */}
          <Dialog open={categoryModal} onOpenChange={setCategoryModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FolderPlus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Stock Category</DialogTitle>
                <DialogDescription>Define categories for taxonomic classification.</DialogDescription>
              </DialogHeader>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="catName">Category Name</Label>
                  <Input id="catName" placeholder="Earrings" {...categoryForm.register("name")} />
                  {categoryForm.formState.errors.name && <p className="text-xs text-destructive">{categoryForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Select label="Parent Category (Optional)" {...categoryForm.register("parentId")}>
                    <option value="">No Parent (Top-level)</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Select label="Metal Classification (Optional)" {...categoryForm.register("metalType")}>
                    <option value="">None</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="platinum">Platinum</option>
                    <option value="diamond">Diamond</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setCategoryModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={categoryCreating}>
                    {categoryCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Product Design SKU Dialog */}
          <Dialog open={productModal} onOpenChange={setProductModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Layers className="h-4 w-4" />
                Add Product SKU
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register Product Design (SKU)</DialogTitle>
                <DialogDescription>Define the design parameters used as templates for stock items.</DialogDescription>
              </DialogHeader>
              <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prodSku">SKU Code</Label>
                    <Input id="prodSku" placeholder="RING-PEA-001" {...productForm.register("sku")} />
                    {productForm.formState.errors.sku && <p className="text-xs text-destructive">{productForm.formState.errors.sku.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prodName">Design Name</Label>
                    <Input id="prodName" placeholder="Peacock Ring" {...productForm.register("name")} />
                    {productForm.formState.errors.name && <p className="text-xs text-destructive">{productForm.formState.errors.name.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Select label="Category" {...productForm.register("categoryId")}>
                      <option value="">Uncategorized</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Select label="Metal Type" {...productForm.register("metalType")}>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="platinum">Platinum</option>
                      <option value="diamond">Diamond</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prodPurity">Default Purity (Fineness)</Label>
                    <Input id="prodPurity" type="number" step="0.001" placeholder="0.916" {...productForm.register("defaultPurity")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prodKarat">Default Karat</Label>
                    <Input id="prodKarat" type="number" placeholder="22" {...productForm.register("defaultKarat")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Select label="Making Charge Mode" {...productForm.register("makingChargeMode")}>
                      <option value="per_gram">Per Gram</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Price</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prodMakingValue">Making Charge Value</Label>
                    <Input id="prodMakingValue" type="number" step="0.0001" placeholder="450" {...productForm.register("makingChargeValue")} />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setProductModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={productCreating}>
                    {productCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register SKU
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Stock Item Dialog */}
          <Dialog open={itemModal} onOpenChange={setItemModal}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Stock Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register Stock Piece</DialogTitle>
                <DialogDescription>Record a physical piece in the warehouse ledger.</DialogDescription>
              </DialogHeader>
              <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Select label="Select Product Design" {...itemForm.register("productId")} required>
                      <option value="">— Select SKU —</option>
                      {products?.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Select label="Supplier Vendor" {...itemForm.register("supplierId")}>
                      <option value="">Internal Stock (No Supplier)</option>
                      {suppliers?.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="itemTag">Tag Number (Unique Barcode)</Label>
                    <Input id="itemTag" placeholder="RNG-0004" {...itemForm.register("tagNumber")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemLoc">Location / Warehouse Showcase</Label>
                    <Input id="itemLoc" placeholder="Showcase B-3" {...itemForm.register("location")} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="itemGross">Gross Weight (g)</Label>
                    <Input id="itemGross" type="number" step="0.001" placeholder="8.500" {...itemForm.register("grossWeight")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemNet">Net Weight (Metal g)</Label>
                    <Input id="itemNet" type="number" step="0.001" placeholder="8.000" {...itemForm.register("netWeight")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemStone">Stone Weight (g)</Label>
                    <Input id="itemStone" type="number" step="0.001" placeholder="0.500" {...itemForm.register("stoneWeight")} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="itemPurity">Purity Fineness</Label>
                    <Input id="itemPurity" type="number" step="0.001" {...itemForm.register("purityFineness")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemKarat">Karat</Label>
                    <Input id="itemKarat" type="number" {...itemForm.register("karat")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="itemCost">Cost Price (INR)</Label>
                    <Input id="itemCost" type="number" step="0.01" placeholder="42000" {...itemForm.register("costPrice")} />
                  </div>
                </div>

                {/* File Uploader */}
                <div className="space-y-2">
                  <Label>Attach Item Photo</Label>
                  <div className="flex items-center gap-4 border p-3 rounded-md bg-muted/20">
                    <div className="relative flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed bg-background">
                      {imagePreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- intentional: blob URL from URL.createObjectURL() cannot be optimized by next/image
                        <img src={imagePreviewUrl} alt="Preview" className="size-full rounded-md object-cover" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="itemFile" />
                      <label htmlFor="itemFile" className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium cursor-pointer hover:bg-muted">
                        {assetUploading ? "Uploading..." : "Choose File"}
                      </label>
                      <p className="text-[10px] text-muted-foreground">JPEG, PNG or WebP up to 5MB.</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setItemModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={itemCreating || assetUploading}>
                    {itemCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Log Stock Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="items" className="gap-2">
            <Tag className="h-4 w-4" />
            Stock Items (Physical)
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Layers className="h-4 w-4" />
            Catalogue designs (SKUs)
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Boxes className="h-4 w-4" />
            Categories Tree
          </TabsTrigger>
        </TabsList>

        {/* Stock Items Tab */}
        <TabsContent value="items">
          <div className="flex gap-2 max-w-lg mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items by tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)} className="w-40 h-9">
              <option value="">All Statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="in_transit">In Transit</option>
              <option value="melted">Melted</option>
            </Select>
          </div>

          <Card className="shadow-sm border">
            <CardContent className="p-0">
              {itemsLoading ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : items && items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag ID</TableHead>
                      <TableHead>Product design</TableHead>
                      <TableHead>Gross Weight</TableHead>
                      <TableHead>Net Weight</TableHead>
                      <TableHead>Purity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold font-mono text-xs">{item.tagNumber || "BULK-STOCK"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.product?.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{item.product?.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatWeight(item.grossWeight)}</TableCell>
                        <TableCell>{formatWeight(item.netWeight)}</TableCell>
                        <TableCell>
                          {item.karat ? `${item.karat}K (${Number(item.purityFineness) * 1000})` : `${Number(item.purityFineness) * 1000}`}
                        </TableCell>
                        <TableCell>{item.location || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium uppercase border ${
                            item.status === "in_stock" ? "bg-success/10 text-success border-success/30" :
                            item.status === "reserved" ? "bg-warning/10 text-warning border-warning/30" :
                            item.status === "sold" ? "bg-primary/10 text-primary border-primary/30" :
                            "bg-muted text-muted-foreground border-muted-foreground/30"
                          }`}>
                            {item.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/inventory/items/${item.id}`}>
                            <Button variant="outline" size="sm">Details</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Tag className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="font-medium">No stock items registered yet</p>
                  <p className="text-xs">Add a physical piece to start tracking stock.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card className="shadow-sm border">
            <CardContent className="p-0">
              {productsLoading ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : products && products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Design Name</TableHead>
                      <TableHead>Metal</TableHead>
                      <TableHead>Purity</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Making Charge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((prod) => (
                      <TableRow key={prod.id}>
                        <TableCell className="font-bold font-mono text-xs text-primary">{prod.sku}</TableCell>
                        <TableCell className="font-medium">{prod.name}</TableCell>
                        <TableCell className="capitalize">{prod.metalType}</TableCell>
                        <TableCell>
                          {prod.defaultKarat ? `${prod.defaultKarat}K (${Number(prod.defaultPurity || 0) * 1000})` : prod.defaultPurity ? `${Number(prod.defaultPurity) * 1000}` : "—"}
                        </TableCell>
                        <TableCell>{prod.category?.name || "Uncategorized"}</TableCell>
                        <TableCell>
                          {prod.makingChargeMode === "per_gram" ? `${formatINR(prod.makingChargeValue || "0")} /g` :
                           prod.makingChargeMode === "percentage" ? `${Number(prod.makingChargeValue || 0)}%` :
                           prod.makingChargeMode === "flat" ? formatINR(prod.makingChargeValue || "0") :
                           "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Layers className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="font-medium">No product design templates registered</p>
                  <p className="text-xs">Add a Product SKU design before adding physical inventory items.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Categories Hierarchy</CardTitle>
              <CardDescription>View classification and tree dependencies.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {categoriesLoading ? (
                <div className="flex h-36 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : categories && categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category Name</TableHead>
                      <TableHead>Metal Type</TableHead>
                      <TableHead>Parent ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                            <Gem className="size-3" />
                          </span>
                          {cat.name}
                        </TableCell>
                        <TableCell className="capitalize">{cat.metalType || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{cat.parentId || "Top-Level"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Boxes className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="font-medium">No stock categories created yet</p>
                  <p className="text-xs">Create categories to structure your inventory catalog.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
