"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/server";
import { onboardBusiness } from "@/lib/tenants/onboard";

const OnboardSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
});

export async function onboardBusinessAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const businessName = formData.get("businessName") as string;
  const ownerName = formData.get("ownerName") as string;

  const result = OnboardSchema.safeParse({ businessName, ownerName });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { error: "Unauthenticated. Please log in first." };
    }

    const onboardResult = await onboardBusiness({
      authUserId: session.user.id,
      email: session.user.email,
      ownerName,
      businessName,
    });

    // Set active tenant cookie
    const cookieStore = await cookies();
    cookieStore.set("current_tenant_id", onboardResult.tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Onboarding server action error:", err);
    return { error: err instanceof Error ? err.message : "Onboarding failed" };
  }
}

export async function selectTenantAction(tenantId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return { error: "Unauthenticated" };
    }

    // Verify user actually belongs to this tenant
    const user = await prisma.user.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const membership = await prisma.userTenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: user.id,
        },
      },
      select: { isActive: true },
    });

    if (!membership || !membership.isActive) {
      return { error: "Membership not found or inactive" };
    }

    // Set active tenant cookie
    const cookieStore = await cookies();
    cookieStore.set("current_tenant_id", tenantId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Select tenant action error:", err);
    return { error: "Failed to select business" };
  }
}
