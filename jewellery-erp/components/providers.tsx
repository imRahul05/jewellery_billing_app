"use client";

import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query/client";

/**
 * App-wide client providers, mounted once in the root layout:
 *  - next-themes for light/dark (class strategy, matches globals.css `.dark`).
 *  - TanStack Query for all server state (+ Devtools in dev only).
 *
 * Neon Auth is accessed directly via `authClient` (lib/auth/client.ts) in the
 * auth forms, and server-side via `auth` (lib/auth/server.ts) — no root
 * provider needed for the custom RHF/Zod auth flow.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Stable per-render on the browser (singleton), fresh per request on server.
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
