"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

export function StudentInboxCard({ initialUnreadCount = 0 }: { initialUnreadCount?: number }) {
  const t = useT();
  const pathname = usePathname();
  const [count, setCount] = useState(initialUnreadCount);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.count ?? 0));
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    setCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(id);
  }, [refresh, pathname]);

  const badgeLabel = count > 99 ? "99+" : String(count);

  return (
    <Link
      href="/dashboard/messages"
      className="relative flex flex-col justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] text-center transition hover:border-[var(--color-primary)]/30"
    >
      {count > 0 ? (
        <span
          className="absolute end-4 top-4 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-xs font-bold text-white"
          aria-label={t("dashboard.page.inboxUnreadAria", "{count} unread messages").replace(
            "{count}",
            String(count),
          )}
        >
          {badgeLabel}
        </span>
      ) : null}
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
        {t("dashboard.page.inboxTitle", "Inbox")}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.page.inboxDesc",
          "Messages and conversations from admin or your teacher",
        )}
      </p>
      <span className="mt-4 inline-flex w-fit self-center items-center rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-base font-medium text-white transition hover:bg-[var(--color-primary-hover)]">
        {t("dashboard.page.openMessagesButton", "Open messages")}
        {count > 0 ? (
          <span className="ms-2 inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
            {badgeLabel}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
