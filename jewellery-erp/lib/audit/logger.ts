import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { headers } from "next/headers";
import { peekTenantContext } from "@/lib/db/tenant-context";

export interface AuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  tenantId?: string | null;
  actorUserId?: string | null;
}

/**
 * Persists an action to the append-only AuditLog table.
 * Automatically captures request metadata (IP address, User Agent, Request ID) from headers if available.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  let requestId: string | null = null;

  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0] || null;
    userAgent = h.get("user-agent");
    requestId = h.get("x-request-id");
  } catch {
    // Graceful fallback when executed outside request context (e.g. standalone scripts, testing)
  }

  const ctx = peekTenantContext();
  const tenantId = input.tenantId !== undefined ? input.tenantId : (ctx?.tenantId ?? null);
  const actorUserId = input.actorUserId !== undefined ? input.actorUserId : (ctx?.userId ?? null);

  await prisma.auditLog.create({
    data: {
      tenantId,
      actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before ? JSON.parse(JSON.stringify(input.before)) : null,
      after: input.after ? JSON.parse(JSON.stringify(input.after)) : null,
      ipAddress,
      userAgent,
      requestId,
    },
  });
}
