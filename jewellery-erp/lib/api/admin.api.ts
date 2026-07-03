import { api } from "./http";

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  gstin: string | null;
  pan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  onboardedAt: string | null;
  createdAt: string;
  owner?: {
    fullName: string | null;
    email: string;
  } | null;
}

export interface AdminMembership {
  id: string;
  isActive: boolean;
  joinedAt: string | null;
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  roles: string[];
}

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface BusinessDetailResponse {
  tenant: TenantDetails;
  memberships: AdminMembership[];
  roles: AdminRole[];
}

export interface AddMemberRequest {
  email: string;
  fullName: string;
  roleId: string;
  password?: string;
}

export const adminApi = {
  listBusinesses: () => api.get<TenantDetails[]>("/admin/businesses"),
  createBusiness: (data: { businessName: string; ownerName: string; ownerEmail: string; ownerPassword?: string }) =>
    api.post<TenantDetails>("/admin/businesses", data),
  getBusiness: (id: string) => api.get<BusinessDetailResponse>(`/admin/businesses/${id}`),
  updateBusinessStatus: (id: string, data: { isActive: boolean }) =>
    api.patch<TenantDetails>(`/admin/businesses/${id}`, data),
  updateBusiness: (id: string, data: Partial<Omit<TenantDetails, "id" | "createdAt" | "onboardedAt">>) =>
    api.patch<TenantDetails>(`/admin/businesses/${id}`, data),
  addBusinessMember: (id: string, data: AddMemberRequest) =>
    api.post<AdminMembership>(`/admin/businesses/${id}/members`, data),
};
