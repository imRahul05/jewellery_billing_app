import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { type StockMovement } from "@prisma/client";

export interface SerializedStockMovement extends Omit<StockMovement, "weight" | "balanceAfterWeight"> {
  weight: string;
  balanceAfterWeight: string | null;
}

export function serializeStockMovement(mov: StockMovement): SerializedStockMovement {
  return {
    ...mov,
    weight: mov.weight.toString(),
    balanceAfterWeight: mov.balanceAfterWeight ? mov.balanceAfterWeight.toString() : null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:read");
    const resolvedParams = await params;

    return await runWithTenant(session, async () => {
      const movements = await prisma.stockMovement.findMany({
        where: { inventoryItemId: resolvedParams.id },
        orderBy: { occurredAt: "desc" },
      });

      return NextResponse.json({ data: movements.map(serializeStockMovement) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/inventory/items/[id]/movements error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
