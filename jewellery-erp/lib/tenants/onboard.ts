import { prisma } from "@/lib/db";
import { seedTenantRoles } from "@/lib/rbac/seed-tenant-roles";
import { AuditAction, Prisma } from "@prisma/client";

interface OnboardInput {
  authUserId: string;
  email: string;
  ownerName: string;
  businessName: string;
}

interface OnboardResult {
  userId: string;
  tenantId: string;
  membershipId: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Atomic business onboarding transaction.
 * Creates the User projection, Tenant, BusinessSetting, Seeds Tenant Roles,
 * creates UserTenantMembership, assigns the Owner UserRole, and writes audit logs.
 */
export async function onboardBusiness(input: OnboardInput): Promise<OnboardResult> {
  const baseSlug = slugify(input.businessName) || "business";
  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  const slug = `${baseSlug}-${uniqueSuffix}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create or upsert the User projection
    const user = await tx.user.upsert({
      where: { authUserId: input.authUserId },
      create: {
        authUserId: input.authUserId,
        email: input.email,
        fullName: input.ownerName,
      },
      update: {
        email: input.email,
        fullName: input.ownerName,
      },
    });

    // 2. Create the Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: input.businessName,
        slug,
        isActive: true,
        onboardedAt: new Date(),
      },
    });

    // 3. Create Default BusinessSetting
    await tx.businessSetting.create({
      data: {
        tenantId: tenant.id,
        baseCurrency: "INR",
        defaultGstRate: new Prisma.Decimal(3.0),
        gstRegistered: true,
        makingChargeMode: "per_gram",
        defaultMakingCharge: new Prisma.Decimal(0.0),
        invoicePrefix: "INV",
        invoiceNextSeq: BigInt(1),
        financialYearStartMonth: 4,
      },
    });

    // 4. Seed the 5 system roles for the tenant
    await seedTenantRoles(tenant.id, tx);

    // 5. Create UserTenantMembership as Owner
    const membership = await tx.userTenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        isActive: true,
        joinedAt: new Date(),
      },
    });

    // Fetch the Owner role to assign it (using name since key column doesn't exist)
    const ownerRole = await tx.role.findFirstOrThrow({
      where: {
        tenantId: tenant.id,
        name: "Business Owner",
      },
    });

    // 6. Assign Owner UserRole
    await tx.userRole.create({
      data: {
        membershipId: membership.id,
        roleId: ownerRole.id,
      },
    });

    // 7. Write Audit Logs
    // Tenant create audit log
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: user.id,
        action: AuditAction.create,
        entityType: "Tenant",
        entityId: tenant.id,
        after: {
          name: tenant.name,
          slug: tenant.slug,
          isActive: tenant.isActive,
        },
      },
    });

    // Role assignment audit log
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: user.id,
        action: AuditAction.create,
        entityType: "UserRole",
        entityId: `${membership.id}-${ownerRole.id}`,
        after: {
          membershipId: membership.id,
          userId: user.id,
          roleId: ownerRole.id,
          roleKey: "owner",
        },
      },
    });

    return {
      userId: user.id,
      tenantId: tenant.id,
      membershipId: membership.id,
    };
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
}
