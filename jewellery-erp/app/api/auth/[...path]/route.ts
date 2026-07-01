import { auth } from "@/lib/auth/server";

// Catch-all Neon Auth handler — proxies client auth requests to Neon Auth.
export const { GET, POST } = auth.handler();
