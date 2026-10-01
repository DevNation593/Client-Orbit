"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/lib/auth-store";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    void bootstrap();
    const handleUnauthorized = () => {
      clear();
      queryClient.clear();
    };
    window.addEventListener("crm:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("crm:unauthorized", handleUnauthorized);
  }, [bootstrap, clear, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
