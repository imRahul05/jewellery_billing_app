import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MetalType } from "@prisma/client";

const CategoryCreateSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  parentId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType).optional().nullable(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:read");

    return await runWithTenant(session, async () => {
      const categories = await prisma.productCategory.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ data: categories });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/inventory/categories error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:write");
    const jsonBody = await request.json();
    const input = CategoryCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      // Validate parent exists if provided
      if (input.parentId) {
        const parent = await prisma.productCategory.findFirst({
          where: { id: input.parentId, deletedAt: null },
        });
        if (!parent) {
          return NextResponse.json({ error: "Parent category not found." }, { status: 400 });
        }
      }

      // Check unique constraint within same parent
      const existing = await prisma.productCategory.findFirst({
        where: {
          tenantId: session.tenantId,
          parentId: input.parentId || null,
          name: input.name,
          deletedAt: null,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A category with this name already exists under the same parent." },
          { status: 400 }
        );
      }

      const category = await prisma.productCategory.create({
        data: {
          tenantId: session.tenantId,
          name: input.name,
          parentId: input.parentId || null,
          metalType: input.metalType || null,
        },
      });

      return NextResponse.json({ data: category });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/inventory/categories error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
