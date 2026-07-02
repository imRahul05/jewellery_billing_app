import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const AdjustmentCreateSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item reference is required"),
  type: z.enum(["adjustment_in", "adjustment_out"]),
  weight: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)),
  quantity: z.number().int().nonnegative(),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:adjust");
    const jsonBody = await request.json();
    const input = AdjustmentCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: input.inventoryItemId, deletedAt: null },
      });

      if (!item) {
        return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create stock adjustment record
        const adjustment = await tx.stockAdjustment.create({
          data: {
            tenantId: session.tenantId,
            reason: input.reason,
            notes: input.notes || null,
            adjustedBy: session.userId,
            status: "posted",
          },
        });

        // Compute updated weights
        let updatedQty = item.quantity;
        let updatedWeight = new Prisma.Decimal(item.grossWeight);

        if (input.type === "adjustment_out") {
          updatedQty = Math.max(0, item.quantity - input.quantity);
          updatedWeight = Prisma.Decimal.max(0, new Prisma.Decimal(item.grossWeight).sub(input.weight));
        } else {
          updatedQty = item.quantity + input.quantity;
          updatedWeight = new Prisma.Decimal(item.grossWeight).add(input.weight);
        }

        // Update item details
        const updatedItem = await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            quantity: updatedQty,
            grossWeight: updatedWeight,
            // If quantity goes to 0, mark status accordingly
            status: updatedQty === 0 ? "melted" : item.status,
          },
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            inventoryItemId: item.id,
            type: input.type === "adjustment_in" ? "adjustment_in" : "adjustment_out",
            weight: input.weight,
            quantity: input.quantity,
            adjustmentId: adjustment.id,
            balanceAfterWeight: updatedWeight,
          },
        });

        return { adjustment, item: updatedItem };
      });

      return NextResponse.json({ data: result });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/inventory/adjustments error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
