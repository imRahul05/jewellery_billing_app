import { api } from "./http";
import type { ProductCategory, Product, InventoryItem, MetalType, Supplier } from "@prisma/client";

export interface ProductInput {
  sku: string;
  name: string;
  categoryId?: string | null;
  metalType: MetalType;
  defaultPurity?: string;
  defaultKarat?: number;
  makingChargeMode?: string;
  makingChargeValue?: string;
}

export interface InventoryItemInput {
  productId: string;
  supplierId?: string | null;
  tagNumber?: string | null;
  grossWeight: string;
  netWeight: string;
  stoneWeight?: string;
  wastagePercent?: string;
  purityFineness: string;
  karat?: number;
  quantity?: number;
  location?: string;
  costPrice?: string;
  status?: string;
  imageAssetId?: string | null;
}

export interface InventoryItemWithRelations extends InventoryItem {
  product?: Product | null;
  supplier?: Supplier | null;
}

export interface ProductWithRelations extends Product {
  category?: ProductCategory | null;
}

export interface StockAdjustmentInput {
  inventoryItemId: string;
  type: "adjustment_in" | "adjustment_out";
  weight: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockTransferInput {
  inventoryItemId: string;
  fromLocation: string;
  toLocation: string;
  notes?: string;
}

export interface PresignedUploadResponse {
  assetId: string;
  uploadUrl: string;
  publicUrl: string;
}

export const inventoryApi = {
  // Categories
  getCategories: () => 
    api.get<ProductCategory[]>("/inventory/categories"),
  createCategory: (data: { name: string; parentId?: string | null; metalType?: MetalType | null }) => 
    api.post<ProductCategory>("/inventory/categories", data),
  deleteCategory: (id: string) => 
    api.delete<void>(`/inventory/categories/${id}`),

  // Products
  getProducts: (params?: { search?: string; categoryId?: string; metalType?: string; limit?: number; offset?: number }) => 
    api.get<ProductWithRelations[]>("/inventory/products", params),
  createProduct: (data: ProductInput) => 
    api.post<Product>("/inventory/products", data),
  deleteProduct: (id: string) => 
    api.delete<void>(`/inventory/products/${id}`),

  // Inventory Items
  getInventoryItems: (params?: { search?: string; productId?: string; status?: string; location?: string; limit?: number; offset?: number }) => 
    api.get<InventoryItemWithRelations[]>("/inventory/items", params),
  getInventoryItemById: (id: string) => 
    api.get<InventoryItemWithRelations>(`/inventory/items/${id}`),
  createInventoryItem: (data: InventoryItemInput) => 
    api.post<InventoryItemWithRelations>("/inventory/items", data),
  updateInventoryItem: (id: string, data: Partial<InventoryItemInput>) => 
    api.patch<InventoryItemWithRelations>(`/inventory/items/${id}`, data),
  deleteInventoryItem: (id: string) => 
    api.delete<void>(`/inventory/items/${id}`),
  getItemMovements: (id: string) => 
    api.get<unknown[]>(`/inventory/items/${id}/movements`), // Returns StockMovement[]

  // Asset Upload
  getPresignedUploadUrl: (data: { fileName: string; contentType: string; purpose: string }) => 
    api.post<PresignedUploadResponse>("/assets/upload", data),

  // Adjustments & Transfers
  postStockAdjustment: (data: StockAdjustmentInput) => 
    api.post<unknown>("/inventory/adjustments", data),
  postStockTransfer: (data: { inventoryItemId: string; toLocation: string }) => 
    api.post<unknown>("/inventory/transfers", data),
  receiveStockTransfer: (id: string) => 
    api.patch<unknown>(`/inventory/transfers/${id}`, {}),
};
