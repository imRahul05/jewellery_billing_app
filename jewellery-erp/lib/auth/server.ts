import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Server-side Neon Auth (Better Auth) instance. Exposes Better Auth server
 * methods (`auth.getSession`, `auth.signIn`, `auth.signUp`, …) plus
 * `auth.handler()` (API route) and `auth.middleware()` (route protection).
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "http://localhost:3000",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "placeholder-secret-at-least-32-chars-long",
  },
});
