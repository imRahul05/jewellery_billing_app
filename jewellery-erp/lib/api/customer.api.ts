import { api } from "./http";
import type { Customer } from "@prisma/client";

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  addressJson?: unknown;
  openingBalance?: string;
  notes?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  type: "invoice" | "payment";
  date: string;
  amount: string;
  description: string;
  balanceAfter: string;
}

export const customerApi = {
  getCustomers: (params?: { search?: string; limit?: number; offset?: number }) => 
    api.get<Customer[]>("/customers", params),
  getCustomerById: (id: string) => 
    api.get<Customer>(`/customers/${id}`),
  createCustomer: (data: CustomerInput) => 
    api.post<Customer>("/customers", data),
  updateCustomer: (id: string, data: Partial<CustomerInput>) => 
    api.patch<Customer>(`/customers/${id}`, data),
  deleteCustomer: (id: string) => 
    api.delete<void>(`/customers/${id}`),
  getCustomerLedger: (id: string, params?: { limit?: number; offset?: number }) => 
    api.get<CustomerLedgerEntry[]>(`/customers/${id}/ledger`, params),
};
