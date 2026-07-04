import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PlanSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  maxUsers: z.number().nullable().optional(),
  maxInvoicesMonthly: z.number().nullable().optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const plans = await prisma.plan.findMany({
          orderBy: { priceMonthly: "asc" },
        });
        return NextResponse.json({ data: plans });
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/v1/admin/plans error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = PlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { id, code, name, priceMonthly, priceYearly, maxUsers, maxInvoicesMonthly, features, isActive } = result.data;

    return await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        const dataPayload = {
          code,
          name,
          priceMonthly,
          priceYearly,
          maxUsers: maxUsers ?? null,
          maxInvoicesMonthly: maxInvoicesMonthly ?? null,
          features: features ?? {},
          isActive,
        };

        if (id) {
          const updated = await prisma.plan.update({
            where: { id },
            data: dataPayload,
          });
          return NextResponse.json({ data: updated });
        } else {
          const created = await prisma.plan.create({
            data: dataPayload,
          });
          return NextResponse.json({ data: created });
        }
      }
    );
  } catch (error: unknown) {
    console.error("POST /api/v1/admin/plans error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
