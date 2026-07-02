import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { serializeInventoryItem } from "../route";

const InventoryItemUpdateSchema = z.object({
  productId: z.string().min(1).optional(),
  supplierId: z.string().optional().nullable(),
  tagNumber: z.string().optional().nullable(),
  grossWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  netWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  stoneWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  wastagePercent: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  purityFineness: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  karat: z.number().int().optional().nullable(),
  quantity: z.number().int().positive().optional(),
  location: z.string().optional().nullable(),
  costPrice: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  status: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:read");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
        include: { product: true, supplier: true },
      });

      if (!item) {
        return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeInventoryItem(item) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/inventory/items/[id] error:", err);
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
    const session = await authorize("inventory:write");
    const resolvedParams = await params;
    const jsonBody = await request.json();
    const input = InventoryItemUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const current = await prisma.inventoryItem.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      // Check unique tag if tagNumber modified
      if (input.tagNumber && input.tagNumber !== current.tagNumber) {
        const existing = await prisma.inventoryItem.findFirst({
          where: {
            tagNumber: input.tagNumber,
            deletedAt: null,
            id: { not: resolvedParams.id },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "An item with this tag number already exists in this business." },
            { status: 400 }
          );
        }
      }

      // Verify weight rules: grossWeight >= netWeight + stoneWeight
      const newGross = input.grossWeight !== undefined ? input.grossWeight : new Prisma.Decimal(current.grossWeight);
      const newNet = input.netWeight !== undefined ? input.netWeight : new Prisma.Decimal(current.netWeight);
      const newStone = input.stoneWeight !== undefined ? input.stoneWeight : new Prisma.Decimal(current.stoneWeight);
      
      const minGross = newNet.add(newStone);
      if (newGross.lessThan(minGross)) {
        return NextResponse.json(
          { error: "Business validation failed: gross weight must be greater than or equal to net weight + stone weight." },
          { status: 422 }
        );
      }

      const updated = await prisma.inventoryItem.update({
        where: { id: resolvedParams.id },
        data: {
          productId: input.productId,
          supplierId: input.supplierId !== undefined ? input.supplierId : undefined,
          tagNumber: input.tagNumber !== undefined ? input.tagNumber : undefined,
          grossWeight: input.grossWeight,
          netWeight: input.netWeight,
          stoneWeight: input.stoneWeight,
          wastagePercent: input.wastagePercent,
          purityFineness: input.purityFineness,
          karat: input.karat !== undefined ? input.karat : undefined,
          quantity: input.quantity,
          location: input.location !== undefined ? input.location : undefined,
          costPrice: input.costPrice,
          status: input.status,
        },
      });

      return NextResponse.json({ data: serializeInventoryItem(updated) });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/inventory/items/[id] error:", err);
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
      const current = await prisma.inventoryItem.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
      }

      // Soft delete
      await prisma.inventoryItem.update({
        where: { id: resolvedParams.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ data: { success: true } });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/inventory/items/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
