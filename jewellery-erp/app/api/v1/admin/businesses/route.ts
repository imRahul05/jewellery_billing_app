import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { prisma } from "@/lib/db";
import { onboardBusiness } from "@/lib/tenants/onboard";
import { z } from "zod";

const BusinessCreateSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
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
        const tenants = await prisma.tenant.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: {
            memberships: {
              where: {
                isActive: true,
                userRoles: {
                  some: {
                    role: {
                      name: "Business Owner",
                    },
                  },
                },
              },
              include: {
                user: true,
              },
            },
          },
        });

        const serialized = tenants.map((t) => {
          const ownerMembership = t.memberships[0];
          return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            gstin: t.gstin,
            pan: t.pan,
            contactEmail: t.contactEmail,
            contactPhone: t.contactPhone,
            isActive: t.isActive,
            onboardedAt: t.onboardedAt ? t.onboardedAt.toISOString() : null,
            createdAt: t.createdAt.toISOString(),
            owner: ownerMembership
              ? {
                  fullName: ownerMembership.user.fullName,
                  email: ownerMembership.user.email,
                }
              : null,
          };
        });

        return NextResponse.json({ data: serialized });

      }
    );
  } catch (error: unknown) {
    console.error("Failed to list businesses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession();
    if (!session.isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = BusinessCreateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { businessName, ownerName, ownerEmail, ownerPassword } = result.data;

    // 1. Register owner account in Neon Auth (Better Auth) via raw server fetch.
    // This creates the auth user without setting cookies on the admin's request session.
    const neonAuthBaseUrl = new URL(request.url).origin;
    const signupUrl = `${neonAuthBaseUrl}/api/auth/sign-up/email`;

    const signupRes = await fetch(signupUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword,
        name: ownerName,
      }),
    });

    let signupData;
    const responseText = await signupRes.text();
    try {
      signupData = JSON.parse(responseText);
    } catch (e) {
      console.error("Non-JSON response from auth system:", responseText);
      return NextResponse.json({ error: "Auth system error: " + responseText.substring(0, 100) }, { status: 500 });
    }

    if (!signupRes.ok || signupData.error) {
      return NextResponse.json(
        { error: signupData.error?.message || "Failed to create user in authentication system" },
        { status: signupRes.status || 400 }
      );
    }

    const authUserId = signupData.user.id;

    // 2. Perform database onboarding transaction.
    // Since we are creating a business, we run it inside a Super Admin db transaction context.
    const onboardResult = await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        return await onboardBusiness({
          authUserId,
          email: ownerEmail,
          ownerName,
          businessName,
        });
      }
    );

    // 3. Fetch and return the newly created tenant.
    const newTenant = await runWithTenant(
      { tenantId: "", userId: session.userId, isSuperAdmin: true },
      async () => {
        return await prisma.tenant.findUnique({
          where: { id: onboardResult.tenantId },
        });
      }
    );

    if (!newTenant) {
      return NextResponse.json({ error: "Onboarding completed but tenant could not be found" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug,
        gstin: newTenant.gstin,
        pan: newTenant.pan,
        contactEmail: newTenant.contactEmail,
        contactPhone: newTenant.contactPhone,
        isActive: newTenant.isActive,
        onboardedAt: newTenant.onboardedAt ? newTenant.onboardedAt.toISOString() : null,
        createdAt: newTenant.createdAt.toISOString(),
        owner: {
          fullName: ownerName,
          email: ownerEmail,
        },
      },
    });

  } catch (error: unknown) {
    console.error("Failed to onboard business:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
