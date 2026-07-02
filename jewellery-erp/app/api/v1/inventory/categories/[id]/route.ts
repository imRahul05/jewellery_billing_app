import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MetalType } from "@prisma/client";

const CategoryUpdateSchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  parentId: z.string().optional().nullable(),
  metalType: z.nativeEnum(MetalType).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:write");
    const resolvedParams = await params;
    const jsonBody = await request.json();
    const input = CategoryUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const current = await prisma.productCategory.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      // Check unique constraint if name/parentId is modified
      const newName = input.name !== undefined ? input.name : current.name;
      const newParentId = input.parentId !== undefined ? input.parentId : current.parentId;

      if (input.name !== undefined || input.parentId !== undefined) {
        // Prevent setting a category as its own parent
        if (newParentId === resolvedParams.id) {
          return NextResponse.json({ error: "A category cannot be its own parent." }, { status: 400 });
        }

        const existing = await prisma.productCategory.findFirst({
          where: {
            tenantId: session.tenantId,
            parentId: newParentId || null,
            name: newName,
            deletedAt: null,
            id: { not: resolvedParams.id },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: "A category with this name already exists under the same parent." },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.productCategory.update({
        where: { id: resolvedParams.id },
        data: {
          name: input.name,
          parentId: input.parentId !== undefined ? input.parentId : undefined,
          metalType: input.metalType !== undefined ? input.metalType : undefined,
        },
      });

      return NextResponse.json({ data: updated });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/inventory/categories/[id] error:", err);
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
      const current = await prisma.productCategory.findUnique({
        where: { id: resolvedParams.id, deletedAt: null },
      });

      if (!current) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      // Perform soft delete
      await prisma.productCategory.update({
        where: { id: resolvedParams.id },
        data: { deletedAt: new Date() },
      });

      return NextResponse.json({ data: { success: true } });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/inventory/categories/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
