"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query/client";

/**
 * App-wide client providers, mounted once in the root layout:
 *  - NeonAuthUIProvider wraps the application, which includes ThemeProvider (next-themes)
 *    and configuration for Neon's Auth UI component rendering.
 *  - TanStack Query for all server state (+ Devtools in dev only).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Stable per-render on the browser (singleton), fresh per request on server.
  const queryClient = getQueryClient();
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      redirectTo="/dashboard"
      Link={Link}
      defaultTheme="system"
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </NeonAuthUIProvider>
  );
}

