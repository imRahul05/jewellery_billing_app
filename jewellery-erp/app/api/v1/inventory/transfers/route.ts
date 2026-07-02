import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const TransferDispatchSchema = z.object({
  inventoryItemId: z.string().min(1, "Inventory item reference is required"),
  toLocation: z.string().min(1, "Destination location is required"),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:transfer");
    const jsonBody = await request.json();
    const input = TransferDispatchSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: input.inventoryItemId, deletedAt: null },
      });

      if (!item) {
        return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
      }

      if (item.status === "in_transit") {
        return NextResponse.json({ error: "Item is already in transit." }, { status: 400 });
      }

      const fromLocation = item.location || "Main Vault";

      const transfer = await prisma.$transaction(async (tx) => {
        // Create stock transfer record
        const xfer = await tx.stockTransfer.create({
          data: {
            tenantId: session.tenantId,
            fromLocation,
            toLocation: input.toLocation,
            status: "in_transit",
            dispatchedBy: session.userId,
            dispatchedAt: new Date(),
          },
        });

        // Set item to in_transit
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { status: "in_transit" },
        });

        // Record transfer out movement
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            inventoryItemId: item.id,
            type: "transfer_out",
            weight: item.grossWeight,
            quantity: item.quantity,
            transferId: xfer.id,
            balanceAfterWeight: new Prisma.Decimal(item.grossWeight),
          },
        });

        return xfer;
      });

      return NextResponse.json({ data: transfer });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/inventory/transfers error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("inventory:transfer");
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get("transferId");

    if (!transferId) {
      return NextResponse.json({ error: "Transfer ID is required." }, { status: 400 });
    }

    return await runWithTenant(session, async () => {
      const transfer = await prisma.stockTransfer.findUnique({
        where: { id: transferId },
      });

      if (!transfer) {
        return NextResponse.json({ error: "Transfer record not found." }, { status: 404 });
      }

      if (transfer.status !== "in_transit") {
        return NextResponse.json({ error: "Transfer has already been processed." }, { status: 400 });
      }

      // Find the associated inventory item from the transfer out movement
      const movementOut = await prisma.stockMovement.findFirst({
        where: { transferId: transfer.id, type: "transfer_out" },
      });

      if (!movementOut) {
        return NextResponse.json({ error: "Stock movement for transfer not found." }, { status: 404 });
      }

      const item = await prisma.inventoryItem.findUnique({
        where: { id: movementOut.inventoryItemId },
      });

      if (!item) {
        return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update transfer status
        const updatedXfer = await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "completed",
            receivedBy: session.userId,
            receivedAt: new Date(),
          },
        });

        // Set item to new location and active in_stock status
        const updatedItem = await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            location: transfer.toLocation,
            status: "in_stock",
          },
        });

        // Record transfer in movement
        await tx.stockMovement.create({
          data: {
            tenantId: session.tenantId,
            inventoryItemId: item.id,
            type: "transfer_in",
            weight: item.grossWeight,
            quantity: item.quantity,
            transferId: transfer.id,
            balanceAfterWeight: new Prisma.Decimal(item.grossWeight),
          },
        });

        return { transfer: updatedXfer, item: updatedItem };
      });

      return NextResponse.json({ data: result });
    });
  } catch (err: unknown) {
    console.error("PATCH /api/v1/inventory/transfers error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
