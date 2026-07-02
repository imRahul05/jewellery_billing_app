import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, MetalType, type Product } from "@prisma/client";

export interface SerializedProduct extends Omit<Product, "defaultPurity" | "makingChargeValue"> {
  defaultPurity: string | null;
  makingChargeValue: string | null;
}

export function serializeProduct(prod: Product): SerializedProduct {
  return {
    ...prod,
    defaultPurity: prod.defaultPurity ? prod.defaultPurity.toString() : null,
    makingChargeValue: prod.makingChargeValue ? prod.makingChargeValue.toString() : null,
  };
}

const ProductCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  categoryId: z.string().optional().nullable(),
  hsnCodeId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType),
  defaultPurity: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional().nullable(),
  defaultKarat: z.number().int().optional().nullable(),
  makingChargeMode: z.string().optional().nullable(),
  makingChargeValue: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional().nullable(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const metalType = searchParams.get("metalType") as MetalType | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    return await runWithTenant(session, async () => {
      const products = await prisma.product.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          categoryId: categoryId || undefined,
          metalType: metalType || undefined,
          OR: search
            ? [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        orderBy: { name: "asc" },
        include: { category: true },
        take: limit,
        skip: offset,
      });

      return NextResponse.json({ data: products.map(serializeProduct) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/inventory/products error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:write");
    const jsonBody = await request.json();
    const input = ProductCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      // Check SKU uniqueness per tenant
      const existing = await prisma.product.findFirst({
        where: {
          sku: input.sku,
          deletedAt: null,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A product with this SKU design reference already exists in this business." },
          { status: 400 }
        );
      }

      const product = await prisma.product.create({
        data: {
          tenantId: session.tenantId,
          sku: input.sku,
          name: input.name,
          categoryId: input.categoryId || null,
          hsnCodeId: input.hsnCodeId || null,
          metalType: input.metalType,
          defaultPurity: input.defaultPurity || null,
          defaultKarat: input.defaultKarat || null,
          makingChargeMode: input.makingChargeMode || null,
          makingChargeValue: input.makingChargeValue || null,
        },
      });

      return NextResponse.json({ data: serializeProduct(product) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/inventory/products error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
