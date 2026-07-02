import { NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma, MetalType, type MetalRate } from "@prisma/client";

export interface SerializedMetalRate extends Omit<MetalRate, "purityFineness" | "ratePerGram"> {
  purityFineness: string | null;
  ratePerGram: string;
}

function serializeMetalRate(rate: MetalRate): SerializedMetalRate {
  return {
    ...rate,
    purityFineness: rate.purityFineness ? rate.purityFineness.toString() : null,
    ratePerGram: rate.ratePerGram.toString(),
  };
}

const MetalRateCreateSchema = z.object({
  metalType: z.nativeEnum(MetalType),
  purityFineness: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)).optional(),
  rateDate: z.string().transform(v => {
    // Keep date component only to match PostgreSQL date type
    const d = new Date(v);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }),
  ratePerGram: z.number().or(z.string()).transform(v => new Prisma.Decimal(v)),
  source: z.string().optional(),
});

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await authorize("metal_rate:read");
    const { searchParams } = new URL(request.url);
    const metalType = searchParams.get("metalType") as MetalType | null;
    const rateDate = searchParams.get("rateDate");

    return await runWithTenant(session, async () => {
      const whereClause: Prisma.MetalRateWhereInput = {};
      if (metalType) whereClause.metalType = metalType;
      if (rateDate) {
        const d = new Date(rateDate);
        d.setUTCHours(0, 0, 0, 0);
        whereClause.rateDate = d;
      }

      const rates = await prisma.metalRate.findMany({
        where: whereClause,
        orderBy: [{ rateDate: "desc" }, { metalType: "asc" }],
      });

      return NextResponse.json({ data: rates.map(serializeMetalRate) });
    });
  } catch (err: unknown) {
    console.error("GET /api/v1/settings/metal-rates error:", err);
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
      const purity = input.purityFineness ?? null;

      // Check unique constraint manually or let upsert run
      const rate = await prisma.metalRate.upsert({
        where: {
          tenantId_metalType_purityFineness_rateDate: {
            tenantId: session.tenantId,
            metalType: input.metalType,
            purityFineness: purity ?? new Prisma.Decimal(0),
            rateDate: input.rateDate,
          },
        },
        create: {
          tenantId: session.tenantId,
          metalType: input.metalType,
          purityFineness: purity,
          rateDate: input.rateDate,
          ratePerGram: input.ratePerGram,
          source: input.source,
        },
        update: {
          ratePerGram: input.ratePerGram,
          source: input.source,
        },
      });

      return NextResponse.json({ data: serializeMetalRate(rate) });
    });
  } catch (err: unknown) {
    console.error("POST /api/v1/settings/metal-rates error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const status = err instanceof Error && err.name === "AuthorizationError" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
