import "server-only";
import { prisma } from "@/lib/db";
import { cacheLife, cacheTag } from "next/cache";

export interface UserSummary {
  fullName: string | null;
  email: string;
}

export interface UserOnboardSummary {
  id: string;
  fullName: string | null;
}

/**
 * Retrieves a user profile by their database user ID.
 */
export async function getUserByIdQuery(userId: string): Promise<UserSummary> {
  "use cache";
  cacheLife("hours");
  cacheTag(`user-${userId}`);

  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
    },
  });
}


/**
 * Retrieves a user profile by their auth service ID.
 */
export async function getUserByAuthIdQuery(authUserId: string): Promise<UserOnboardSummary | null> {
  return prisma.user.findUnique({
    where: { authUserId },
    select: {
      id: true,
      fullName: true,
    },
  });
}
