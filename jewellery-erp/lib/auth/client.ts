"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Client-side Neon Auth (Better Auth) instance. Exposes hooks + methods:
 * `authClient.signIn.email`, `authClient.signUp.email`, `authClient.useSession`,
 * `authClient.useListOrganizations` (organizations map to ERP tenants), etc.
 */
export const authClient = createAuthClient();
