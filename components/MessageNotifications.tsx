"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useLocale, useT } from "@/components/LocaleProvider";
import { dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { UserRole } from "@/lib/types";

type UnreadItem = {
  conversationId: string;
  studentId: string;
  studentName: string;
  staffId?: string | null;
  staffName?: string | null;
  staffRole?: string | null;
  preview: string;
  unreadCount: number;
  latestAt: string;
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4.2 1.5 5.8 2 6.5H4.5c.5-.7 2-2.3 2-6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isStaffRole(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
}

export function MessageNotifications({ compact = false }: { compact?: boolean }) {
  const { data: session, status } = useSession();
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const dateLocale = dateLocaleForUi(locale);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<UnreadItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const role = session?.user?.role as UserRole | undefined;
  const isStudent = role === "STUDENT";
  const enabled = status === "authenticated" && (isStaffRole(role) || isStudent);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/messages/unread", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.count ?? 0));
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* تجاهل */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), 25_000);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, pathname, refresh]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!enabled) return null;

  const badgeLabel = count > 99 ? "99+" : String(count);
  const titleKey = isStudent
    ? "header.studentMessageNotifications"
    : "header.messageNotifications";
  const titleFallback = isStudent ? "Message notifications" : "Student message notifications";
  const emptyKey = isStudent ? "header.noUnreadStaffMessages" : "header.noUnreadMessages";
  const emptyFallback = isStudent ? "No new messages" : "No new student messages";

  function itemTitle(item: UnreadItem): string {
    if (isStudent) {
      if (item.staffRole) {
        return t(`header.role.${item.staffRole}`, item.staffRole);
      }
      return item.staffName || t("header.staffFallback", "Admin");
    }
    return item.studentName || t("header.studentFallback", "Student");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          void refresh();
        }}
        className={`relative inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition hover:bg-[var(--color-border)]/50 ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
        aria-label={t(titleKey, titleFallback)}
        title={t(titleKey, titleFallback)}
      >
        <BellIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        {count > 0 ? (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-hover)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {t(titleKey, titleFallback)}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              {count > 0
                ? fillMessage(t("header.unreadMessagesCount", "{count} unread"), {
                    count,
                  })
                : t(emptyKey, emptyFallback)}
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-[var(--color-muted)]">
                {t(emptyKey, emptyFallback)}
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.conversationId}
                  href={`/dashboard/messages?c=${encodeURIComponent(item.conversationId)}`}
                  className="block border-b border-[var(--color-border)] px-3 py-2.5 last:border-0 hover:bg-[var(--color-border)]/40"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                      {itemTitle(item)}
                    </p>
                    {item.unreadCount > 1 ? (
                      <span className="shrink-0 rounded-full bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                        {item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]">
                    {item.preview || t("header.messageAttachment", "Attachment")}
                  </p>
                  {item.latestAt ? (
                    <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                      {new Date(item.latestAt).toLocaleString(dateLocale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-[var(--color-border)] px-3 py-2">
            <Link
              href="/dashboard/messages"
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              onClick={() => setOpen(false)}
            >
              {t("header.openMessages", "Open messages")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
