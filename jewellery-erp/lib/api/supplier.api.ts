import { api } from "./http";
import type { Supplier } from "@prisma/client";

export interface SupplierInput {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  addressJson?: unknown;
  openingBalance?: string;
}

export const supplierApi = {
  getSuppliers: (params?: { search?: string; limit?: number; offset?: number }) => 
    api.get<Supplier[]>("/suppliers", params),
  getSupplierById: (id: string) => 
    api.get<Supplier>(`/suppliers/${id}`),
  createSupplier: (data: SupplierInput) => 
    api.post<Supplier>("/suppliers", data),
  updateSupplier: (id: string, data: Partial<SupplierInput>) => 
    api.patch<Supplier>(`/suppliers/${id}`, data),
  deleteSupplier: (id: string) => 
    api.delete<void>(`/suppliers/${id}`),
};
