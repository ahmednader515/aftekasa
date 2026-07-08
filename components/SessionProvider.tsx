"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/** Poll session periodically to detect login from another device (without hammering the DB). */
const SESSION_REFETCH_INTERVAL = 45;

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={SESSION_REFETCH_INTERVAL}
      refetchOnWindowFocus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
