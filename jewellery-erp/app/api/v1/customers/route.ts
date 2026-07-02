import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, type Customer } from "@prisma/client";

export interface SerializedCustomer extends Omit<Customer, "openingBalance"> {
  openingBalance: string;
}

export function serializeCustomer(cust: Customer): SerializedCustomer {
  return {
    ...cust,
    openingBalance: cust.openingBalance.toString(),
  };
}

const CustomerCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  gstin: z.string().length(15).optional().nullable().or(z.literal("")),
  addressJson: z.unknown().optional().nullable(),
  openingBalance: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("customer:read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    return await runWithTenant(session, async () => {
      // Find all live customers under this tenant
      const customers = await prisma.customer.findMany({
        where: {
          deletedAt: null,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
              ]
            : undefined,
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      });

      return NextResponse.json({ data: customers.map(serializeCustomer) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/customers error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("customer:write");
    const jsonBody = await request.json();
    const input = CustomerCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      // Verify phone uniqueness within tenant if phone is provided
      if (input.phone) {
        const existing = await prisma.customer.findFirst({
          where: {
            phone: input.phone,
            deletedAt: null,
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: "A customer with this phone number already exists in this business." },
            { status: 400 }
          );
        }
      }

      const customer = await prisma.customer.create({
        data: {
          tenantId: session.tenantId,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          gstin: input.gstin || null,
          addressJson: input.addressJson !== undefined ? (input.addressJson as Prisma.InputJsonValue) : undefined,
          openingBalance: input.openingBalance ?? new Prisma.Decimal(0.0),
          notes: input.notes || null,
        },
      });

      return NextResponse.json({ data: serializeCustomer(customer) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/customers error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
