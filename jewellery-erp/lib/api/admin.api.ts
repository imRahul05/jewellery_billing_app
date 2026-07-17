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

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalInvoices: number;
  tenantGrowth: { month: string; count: number }[];
  businessActivity: { businessName: string; activityCount: number }[];
}

export interface PlatformPlan {
  id: string;
  code: string;
  name: string;
  priceMonthly: string | number;
  priceYearly: string | number;
  maxUsers: number | null;
  maxInvoicesMonthly: number | null;
  features: unknown;
  isActive: boolean;
  createdAt: string;
}

export interface PlatformUserMembership {
  id: string;
  tenantName: string;
  roles: string[];
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  memberships: PlatformUserMembership[];
}

export interface PlatformAuditLog {
  id: string;
  occurredAt: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  tenantName: string;
  actor: {
    email: string;
    fullName: string | null;
  } | null;
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
  getStats: () => api.get<PlatformStats>("/admin/stats"),
  listPlans: () => api.get<PlatformPlan[]>("/admin/plans"),
  savePlan: (data: Partial<PlatformPlan>) => api.post<PlatformPlan>("/admin/plans", data),
  searchUsers: (search: string) => api.get<PlatformUser[]>("/admin/users", { search }),
  getPlatformAuditLogs: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PlatformAuditLog[]>("/admin/audit", params),
  startImpersonation: (tenantId: string) => api.post<{ success: boolean }>("/admin/impersonate/start", { tenantId }),
  stopImpersonation: () => api.post<{ success: boolean }>("/admin/impersonate/stop"),
};
