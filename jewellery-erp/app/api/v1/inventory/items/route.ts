import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, type InventoryItem } from "@prisma/client";

export interface SerializedInventoryItem extends Omit<
  InventoryItem,
  "grossWeight" | "netWeight" | "stoneWeight" | "wastagePercent" | "purityFineness" | "costPrice"
> {
  grossWeight: string;
  netWeight: string;
  stoneWeight: string;
  wastagePercent: string;
  purityFineness: string;
  costPrice: string;
}

export function serializeInventoryItem(item: InventoryItem): SerializedInventoryItem {
  return {
    ...item,
    grossWeight: item.grossWeight.toString(),
    netWeight: item.netWeight.toString(),
    stoneWeight: item.stoneWeight.toString(),
    wastagePercent: item.wastagePercent.toString(),
    purityFineness: item.purityFineness.toString(),
    costPrice: item.costPrice.toString(),
  };
}

const InventoryItemCreateSchema = z.object({
  productId: z.string().min(1, "Product reference is required"),
  supplierId: z.string().optional().nullable(),
  tagNumber: z.string().optional().nullable(),
  grossWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)),
  netWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)),
  stoneWeight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  wastagePercent: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  purityFineness: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)),
  karat: z.number().int().optional().nullable(),
  quantity: z.number().int().positive().optional().default(1),
  location: z.string().optional().nullable(),
  costPrice: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  status: z.string().optional().default("in_stock"),
  imageAssetId: z.string().optional().nullable(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const productId = searchParams.get("productId") || "";
    const status = searchParams.get("status") || "";
    const location = searchParams.get("location") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    return await runWithTenant(session, async () => {
      const items = await prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          productId: productId || undefined,
          status: status || undefined,
          location: location || undefined,
          OR: search
            ? [
                { tagNumber: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        orderBy: { createdAt: "desc" },
        include: { product: true, supplier: true },
        take: limit,
        skip: offset,
      });

      return NextResponse.json({ data: items.map(serializeInventoryItem) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/inventory/items error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:write");
    const jsonBody = await request.json();
    const input = InventoryItemCreateSchema.parse(jsonBody);

    // Business rule: grossWeight >= netWeight + stoneWeight
    const minGross = input.netWeight.add(input.stoneWeight ?? new Prisma.Decimal(0));
    if (input.grossWeight.lessThan(minGross)) {
      return NextResponse.json(
        { error: "Business validation failed: gross weight must be greater than or equal to net weight + stone weight." },
        { status: 422 }
      );
    }

    return await runWithTenant(session, async () => {
      // Unique tag check if tagNumber is provided
      if (input.tagNumber) {
        const existing = await prisma.inventoryItem.findFirst({
          where: {
            tagNumber: input.tagNumber,
            deletedAt: null,
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "An item with this tag number already exists in this business." },
            { status: 400 }
          );
        }
      }

      // Execute transaction to create item and movement logs
      const result = await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.create({
          data: {
            tenantId: session.tenantId,
            productId: input.productId,
            supplierId: input.supplierId || null,
            tagNumber: input.tagNumber || null,
            grossWeight: input.grossWeight,
            netWeight: input.netWeight,
            stoneWeight: input.stoneWeight ?? new Prisma.Decimal(0.0),
            wastagePercent: input.wastagePercent ?? new Prisma.Decimal(0.0),
            purityFineness: input.purityFineness,
            karat: input.karat || null,
            quantity: input.quantity,
            location: input.location || null,
            costPrice: input.costPrice ?? new Prisma.Decimal(0.0),
            status: input.status,
          },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            inventoryItemId: item.id,
            type: "purchase_in",
            weight: item.grossWeight,
            quantity: item.quantity,
            referenceType: "PurchaseRecord",
            referenceId: item.supplierId || undefined,
            balanceAfterWeight: item.grossWeight,
          },
        });

        // Link the image file asset to the inventory item
        if (input.imageAssetId) {
          await tx.fileAsset.update({
            where: { id: input.imageAssetId },
            data: { purpose: `item_image:${item.id}` },
          });
        }

        return item;
      });

      return NextResponse.json({ data: serializeInventoryItem(result) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/inventory/items error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
