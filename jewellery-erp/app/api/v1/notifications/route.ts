import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession();
    return await runWithTenant(session, async () => {
      const notifications = await prisma.notification.findMany({
        where: {
          tenantId: session.tenantId,
          OR: [
            { userId: session.userId },
            { userId: null }
          ]
        },
        orderBy: { createdAt: "desc" },
      });

      const serialized = notifications.map((n) => ({
        id: n.id,
        tenantId: n.tenantId,
        userId: n.userId,
        channel: n.channel,
        status: n.status,
        category: n.category,
        title: n.title,
        body: n.body,
        payload: n.payload,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        sentAt: n.sentAt ? n.sentAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      }));

      return NextResponse.json({ data: serialized });
    });
  } catch (error: unknown) {
    console.error("GET /api/v1/notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    const body = await request.json();
    const result = PatchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { id, all } = result.data;

    return await runWithTenant(session, async () => {
      if (all) {
        await prisma.notification.updateMany({
          where: {
            tenantId: session.tenantId,
            OR: [
              { userId: session.userId },
              { userId: null }
            ],
            status: "pending",
          },
          data: {
            status: "read",
            readAt: new Date(),
          },
        });
      } else if (id) {
        await prisma.notification.update({
          where: {
            id,
            tenantId: session.tenantId,
          },
          data: {
            status: "read",
            readAt: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true });
    });
  } catch (error: unknown) {
    console.error("PATCH /api/v1/notifications error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
