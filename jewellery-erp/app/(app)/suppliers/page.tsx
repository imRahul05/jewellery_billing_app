import { withTenant } from "@/lib/auth/with-tenant";
import { authorize } from "@/lib/rbac/authorize";
import { getSuppliersQuery } from "@/lib/db/queries/suppliers";
import { SuppliersClientWrapper, type SerializedSupplier } from "./_components/suppliers-client-wrapper";

export const dynamic = "force-dynamic";

interface SuppliersPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function SuppliersPage({ searchParams }: SuppliersPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;

  return withTenant(async (ctx) => {
    // 1. Authorize view permission
    await authorize("supplier:read");

    // 2. Fetch list of suppliers from database via DAL query
    const suppliers = await getSuppliersQuery(ctx.tenantId, {
      search: params.search || undefined,
    });

    // 3. Serialize Prisma decimal/date fields for safe transit to Client Component
    const serializedSuppliers: SerializedSupplier[] = suppliers.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      name: s.name,
      phone: s.phone,
      email: s.email,
      gstin: s.gstin,
      addressJson: s.addressJson,
      openingBalance: s.openingBalance.toString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null,
    }));

    return <SuppliersClientWrapper tenantId={ctx.tenantId} initialSuppliers={serializedSuppliers} />;
  });
}
