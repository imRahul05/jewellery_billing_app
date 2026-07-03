import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, type Supplier } from "@prisma/client";
import { revalidateTag } from "next/cache";


export interface SerializedSupplier extends Omit<Supplier, "openingBalance"> {
  openingBalance: string;
}

export function serializeSupplier(sup: Supplier): SerializedSupplier {
  return {
    ...sup,
    openingBalance: sup.openingBalance.toString(),
  };
}

const SupplierCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  gstin: z.string().length(15).optional().nullable().or(z.literal("")),
  addressJson: z.unknown().optional().nullable(),
  openingBalance: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("supplier:read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    return await runWithTenant(session, async () => {
      const suppliers = await prisma.supplier.findMany({
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

      return NextResponse.json({ data: suppliers.map(serializeSupplier) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/suppliers error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("supplier:write");
    const jsonBody = await request.json();
    const input = SupplierCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const supplier = await prisma.supplier.create({
        data: {
          tenantId: session.tenantId,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          gstin: input.gstin || null,
          addressJson: input.addressJson !== undefined ? (input.addressJson as Prisma.InputJsonValue) : undefined,
          openingBalance: input.openingBalance ?? new Prisma.Decimal(0.0),
        },
      });

      revalidateTag(`suppliers-${session.tenantId}`, { expire: 0 });

      return NextResponse.json({ data: serializeSupplier(supplier) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/suppliers error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
