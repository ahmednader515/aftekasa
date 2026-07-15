"use client";

import { usePathname } from "next/navigation";

const AUTH_PREFIXES = ["/login", "/register"];

export function SiteChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const hide = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hide) return null;
  return <>{children}</>;
}
