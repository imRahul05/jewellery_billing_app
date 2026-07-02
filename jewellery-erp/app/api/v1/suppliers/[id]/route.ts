import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { serializeSupplier } from "../route";

const SupplierUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  gstin: z.string().length(15).optional().nullable().or(z.literal("")),
  addressJson: z.unknown().optional().nullable(),
  openingBalance: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("supplier:read");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const supplier = await prisma.supplier.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!supplier) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeSupplier(supplier) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/suppliers/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("supplier:write");
    const resolvedParams = await params;
    const jsonBody = await request.json();
    const input = SupplierUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const current = await prisma.supplier.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!current) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      const updated = await prisma.supplier.update({
        where: { id: resolvedParams.id },
        data: {
          name: input.name,
          phone: input.phone !== undefined ? input.phone : undefined,
          email: input.email !== undefined ? (input.email || null) : undefined,
          gstin: input.gstin !== undefined ? (input.gstin || null) : undefined,
          addressJson: input.addressJson !== undefined ? (input.addressJson as Prisma.InputJsonValue) : undefined,
          openingBalance: input.openingBalance,
        },
      });

      return NextResponse.json({ data: serializeSupplier(updated) });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/suppliers/[id] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("supplier:delete");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const current = await prisma.supplier.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!current) {
        return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
      }

      // Perform soft delete
      await prisma.supplier.update({
        where: { id: resolvedParams.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ data: { success: true } });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/suppliers/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
