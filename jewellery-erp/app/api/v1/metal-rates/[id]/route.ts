import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { serializeMetalRate } from "../route";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const MetalRateUpdateSchema = z.object({
  ratePerGram: z.number().or(z.string()).transform(val => new Prisma.Decimal(val)),
  source: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("metal_rate:read");
    const { id } = await params;

    return await runWithTenant(session, async () => {
      const rate = await prisma.metalRate.findUnique({
        where: { id },
      });

      if (!rate) {
        return NextResponse.json({ error: "Metal rate not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeMetalRate(rate) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/metal-rates/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await authorize("metal_rate:write");
    const { id } = await params;
    const jsonBody = await request.json();
    const input = MetalRateUpdateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const existing = await prisma.metalRate.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Metal rate not found" }, { status: 404 });
      }

      // Check if any invoice references this rate, if so we cannot update it
      const referencingLineCount = await prisma.invoiceLineItem.count({
        where: { metalRateId: id },
      });

      if (referencingLineCount > 0) {
        return NextResponse.json(
          { error: "Cannot update metal rate because it is referenced by existing invoices." },
          { status: 400 }
        );
      }

      const updated = await prisma.metalRate.update({
        where: { id },
        data: {
          ratePerGram: input.ratePerGram,
          source: input.source || null,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: session.tenantId,
          actorUserId: session.userId,
          action: "update",
          entityType: "MetalRate",
          entityId: id,
          before: JSON.stringify(serializeMetalRate(existing)),
          after: JSON.stringify(serializeMetalRate(updated)),
        },
      });

      return NextResponse.json({ data: serializeMetalRate(updated) });
    });
  } catch (err: unknown) {
    console.error("PUT /api/v1/metal-rates/[id] error:", err);
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
    const session = await authorize("metal_rate:write");
    const { id } = await params;

    return await runWithTenant(session, async () => {
      const existing = await prisma.metalRate.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Metal rate not found" }, { status: 404 });
      }

      // Block if referenced
      const referencingLineCount = await prisma.invoiceLineItem.count({
        where: { metalRateId: id },
      });

      if (referencingLineCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete metal rate because it is referenced by existing invoices." },
          { status: 400 }
        );
      }

      await prisma.metalRate.delete({
        where: { id },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          tenantId: session.tenantId,
          actorUserId: session.userId,
          action: "delete",
          entityType: "MetalRate",
          entityId: id,
          before: JSON.stringify(serializeMetalRate(existing)),
        },
      });

      return NextResponse.json({ success: true });
    });
  } catch (err: unknown) {
    console.error("DELETE /api/v1/metal-rates/[id] error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
