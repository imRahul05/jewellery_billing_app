import { prisma } from "@/lib/db";

export class PlanRestrictionError extends Error {
  constructor(
    public feature: string,
    public planCode: string,
  ) {
    super(
      `Plan restriction: feature "${feature}" is not allowed on the "${planCode}" plan.`,
    );
    this.name = "PlanRestrictionError";
  }
}

/**
 * Asserts whether the tenant's current plan allows a given permission/feature.
 * Throws PlanRestrictionError if blocked; succeeds silently otherwise.
 */
export async function assertPlanAllows(
  tenantId: string,
  permission: string,
): Promise<void> {
  // Fetch active subscription for the tenant
  const subscription = await prisma.subscription.findFirst({
    where: {
      tenantId,
      status: "active",
    },
    include: {
      plan: true,
    },
  });

  if (!subscription) {
    // Stub-safe: log warning and allow when no active subscription row is set up yet
    console.warn(
      `No active subscription found for tenant ${tenantId}. Allowing access by default.`,
    );
    return;
  }

  const plan = subscription.plan;
  const features = (plan.features as Record<string, boolean>) || {};

  // Check feature groups
  if (permission.startsWith("report:") && features.reports === false) {
    throw new PlanRestrictionError("reports", plan.code);
  }

  if (
    (permission === "user:invite" || permission === "user:manage") &&
    features.multiUser === false
  ) {
    throw new PlanRestrictionError("multi-user management", plan.code);
  }

  // Check user limit count
  if (permission === "user:invite" && plan.maxUsers !== null) {
    const activeMembersCount = await prisma.userTenantMembership.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    if (activeMembersCount >= plan.maxUsers) {
      throw new Error(
        `User limit reached: your "${plan.name}" plan only allows up to ${plan.maxUsers} users.`,
      );
    }
  }

  // Check invoice limit count
  if (permission === "invoice:create" && plan.maxInvoicesMonthly !== null) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyInvoicesCount = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    if (monthlyInvoicesCount >= plan.maxInvoicesMonthly) {
      throw new Error(
        `Invoice limit reached: your "${plan.name}" plan only allows up to ${plan.maxInvoicesMonthly} invoices per month.`,
      );
    }
  }
}
