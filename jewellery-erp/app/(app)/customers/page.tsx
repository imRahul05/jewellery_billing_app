import { withTenant } from "@/lib/auth/with-tenant";
import { authorize } from "@/lib/rbac/authorize";
import { getCustomersQuery } from "@/lib/db/queries/customers";
import { CustomersClientWrapper, type SerializedCustomer } from "./_components/customers-client-wrapper";

export const dynamic = "force-dynamic";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;

  return withTenant(async (ctx) => {
    // 1. Authorize view permission
    await authorize("customer:read");

    // 2. Fetch list of customers from database via DAL query
    const customers = await getCustomersQuery(ctx.tenantId, {
      search: params.search || undefined,
    });

    // 3. Serialize Prisma decimal/date fields for safe transit to Client Component
    const serializedCustomers: SerializedCustomer[] = customers.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      gstin: c.gstin,
      addressJson: c.addressJson,
      openingBalance: c.openingBalance.toString(),
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    }));

    return <CustomersClientWrapper tenantId={ctx.tenantId} initialCustomers={serializedCustomers} />;
  });
}
