import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { serializeCustomer } from "../route";

const CustomerUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  gstin: z.string().length(15).optional().nullable().or(z.literal("")),
  addressJson: z.unknown().optional().nullable(),
  openingBalance: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("customer:read");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const customer = await prisma.customer.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeCustomer(customer) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/customers/[id] error:", err);
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
    const session = await authorize("customer:write");
    const resolvedParams = await params;
    const jsonBody = await request.json();
    const input = CustomerUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const current = await prisma.customer.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!current) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      // Verify phone uniqueness if modified
      if (input.phone && input.phone !== current.phone) {
        const existing = await prisma.customer.findFirst({
          where: {
            phone: input.phone,
            deletedAt: null,
            id: { not: resolvedParams.id },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: "A customer with this phone number already exists in this business." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.customer.update({
        where: { id: resolvedParams.id },
        data: {
          name: input.name,
          phone: input.phone !== undefined ? input.phone : undefined,
          email: input.email !== undefined ? (input.email || null) : undefined,
          gstin: input.gstin !== undefined ? (input.gstin || null) : undefined,
          addressJson: input.addressJson !== undefined ? (input.addressJson as Prisma.InputJsonValue) : undefined,
          openingBalance: input.openingBalance,
          notes: input.notes !== undefined ? input.notes : undefined,
        },
      });

      return NextResponse.json({ data: serializeCustomer(updated) });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/customers/[id] error:", err);
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
    const session = await authorize("customer:delete");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const current = await prisma.customer.findUnique({
        where: {
          id: resolvedParams.id,
          deletedAt: null,
        },
      });

      if (!current) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      // Perform soft delete
      await prisma.customer.update({
        where: { id: resolvedParams.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ data: { success: true } });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/customers/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
