import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { MetalRateCreateSchema } from "@/lib/billing/validation";
import { MetalType, Prisma } from "@prisma/client";

export interface SerializedMetalRate {
  id: string;
  metalType: MetalType;
  purityFineness: string | null;
  rateDate: string;
  ratePerGram: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeMetalRate(rate: Prisma.MetalRateGetPayload<typeof rateSelect>): SerializedMetalRate {
  return {
    ...rate,
    purityFineness: rate.purityFineness ? rate.purityFineness.toString() : null,
    rateDate: rate.rateDate.toISOString().split("T")[0],
    ratePerGram: rate.ratePerGram.toString(),
    createdAt: rate.createdAt.toISOString(),
    updatedAt: rate.updatedAt.toISOString(),
  };
}

const rateSelect = Prisma.validator<Prisma.MetalRateDefaultArgs>()({
  select: {
    id: true,
    tenantId: true,
    metalType: true,
    purityFineness: true,
    rateDate: true,
    ratePerGram: true,
    source: true,
    createdAt: true,
    updatedAt: true,
  }
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("metal_rate:read");
    const { searchParams } = new URL(request.url);
    const metalType = searchParams.get("metalType") as MetalType | null;
    const dateStr = searchParams.get("rateDate");

    return await runWithTenant(session, async () => {
      const where: Prisma.MetalRateWhereInput = {};
      
      if (metalType) {
        where.metalType = metalType;
      }
      if (dateStr) {
        where.rateDate = new Date(dateStr);
      }

      const rates = await prisma.metalRate.findMany({
        where,
        orderBy: [
          { rateDate: "desc" },
          { metalType: "asc" }
        ],
        take: 100,
      });

      return NextResponse.json({ data: rates.map(serializeMetalRate) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/metal-rates error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("metal_rate:write");
    const jsonBody = await request.json();
    const input = MetalRateCreateSchema.parse(jsonBody);

    return await runWithTenant(session, async () => {
      const purity = input.purityFineness ? new Prisma.Decimal(input.purityFineness) : null;
      const rateDate = new Date(input.rateDate);
      rateDate.setUTCHours(0, 0, 0, 0); // truncate time part

      // Upsert metal rate for the date/purity combo
      const rate = await prisma.metalRate.upsert({
        where: {
          tenantId_metalType_purityFineness_rateDate: {
            tenantId: session.tenantId,
            metalType: input.metalType,
            purityFineness: purity ?? new Prisma.Decimal(0.000), // Default purity representation for unique key if null
            rateDate,
          },
        },
        update: {
          ratePerGram: new Prisma.Decimal(input.ratePerGram),
          source: input.source || null,
        },
        create: {
          tenantId: session.tenantId,
          metalType: input.metalType,
          purityFineness: purity ?? new Prisma.Decimal(0.000),
          rateDate,
          ratePerGram: new Prisma.Decimal(input.ratePerGram),
          source: input.source || null,
        },
      });

      // Write audit log
      await prisma.auditLog.create({
        data: {
          tenantId: session.tenantId,
          actorUserId: session.userId,
          action: "create",
          entityType: "MetalRate",
          entityId: rate.id,
          after: JSON.stringify(serializeMetalRate(rate)),
        },
      });

      return NextResponse.json({ data: serializeMetalRate(rate) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/metal-rates error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
