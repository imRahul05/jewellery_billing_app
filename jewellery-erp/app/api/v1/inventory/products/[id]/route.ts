import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, MetalType } from "@prisma/client";
import { serializeProduct } from "../route";

const ProductUpdateSchema = z.object({
  sku: z.string().min(1, "SKU is required").optional(),
  name: z.string().min(1, "Product name is required").optional(),
  categoryId: z.string().optional().nullable(),
  hsnCodeId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType).optional(),
  defaultPurity: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional().nullable(),
  defaultKarat: z.number().int().optional().nullable(),
  makingChargeMode: z.string().optional().nullable(),
  makingChargeValue: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:write");
    const resolvedParams = await params;
    const jsonBody = await request.json();
    const input = ProductUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const current = await prisma.product.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Product design not found" }, { status: 404 });
      }

      // Check SKU uniqueness if modified
      if (input.sku && input.sku !== current.sku) {
        const existing = await prisma.product.findFirst({
          where: {
            sku: input.sku,
            deletedAt: null,
            id: { not: resolvedParams.id },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: "A product with this SKU already exists in this business." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.product.update({
        where: { id: resolvedParams.id },
        data: {
          sku: input.sku,
          name: input.name,
          categoryId: input.categoryId !== undefined ? input.categoryId : undefined,
          hsnCodeId: input.hsnCodeId !== undefined ? input.hsnCodeId : undefined,
          metalType: input.metalType,
          defaultPurity: input.defaultPurity !== undefined ? input.defaultPurity : undefined,
          defaultKarat: input.defaultKarat !== undefined ? input.defaultKarat : undefined,
          makingChargeMode: input.makingChargeMode !== undefined ? input.makingChargeMode : undefined,
          makingChargeValue: input.makingChargeValue !== undefined ? input.makingChargeValue : undefined,
          isActive: input.isActive,
        },
      });

      return NextResponse.json({ data: serializeProduct(updated) });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/inventory/products/[id] error:", err);
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
    const session = await authorize("inventory:delete");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const current = await prisma.product.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Product design not found" }, { status: 404 });
      }

      // Soft delete
      await prisma.product.update({
        where: { id: resolvedParams.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ data: { success: true } });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/inventory/products/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
