"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import type { UserRole } from "@/lib/types";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MessageNotifications } from "@/components/MessageNotifications";
import { useT, useLocalizedEnumValue } from "@/components/LocaleProvider";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.25c.9-3.1 3.4-4.75 6.5-4.75s5.6 1.65 6.5 4.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  const roleLabel: Record<UserRole, string> = {
    ADMIN: useLocalizedEnumValue("ADMIN", "header.role", "Admin"),
    ASSISTANT_ADMIN: useLocalizedEnumValue("ASSISTANT_ADMIN", "header.role", "Assistant admin"),
    STUDENT: useLocalizedEnumValue("STUDENT", "header.role", "Student"),
    TEACHER: useLocalizedEnumValue("TEACHER", "header.role", "Teacher"),
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status !== "authenticated" || !session?.user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/50"
      >
        <span className="max-w-[96px] truncate sm:max-w-[120px]">{session.user.name}</span>
        <span className="text-[var(--color-muted)]">▼</span>
      </button>
      {open && (
        <div className="absolute start-0 top-full z-50 mt-1 w-48 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-hover)]">
          <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
            {roleLabel[session.user.role]}
          </div>
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-sm hover:bg-[var(--color-border)]/50"
            onClick={() => setOpen(false)}
          >
            {t("header.dashboard", "Dashboard")}
          </Link>
          <Link
            href="/dashboard/profile"
            className="block px-3 py-2 text-sm hover:bg-[var(--color-border)]/50"
            onClick={() => setOpen(false)}
          >
            {t("header.editAccount", "Edit account")}
          </Link>
          <button
            type="button"
            className="w-full px-3 py-2 text-start text-sm text-red-600 hover:bg-[var(--color-border)]/50"
            onClick={async () => {
              setOpen(false);
              try {
                await fetch("/api/auth/clear-session", { method: "POST", credentials: "include" });
              } catch {
                /* تجاهل خطأ الشبكة */
              }
              signOut({ callbackUrl: "/" });
            }}
          >
            {t("header.logout", "Log out")}
          </button>
        </div>
      )}
    </div>
  );
}

function AuthActions({
  status,
  session,
  compact = false,
}: {
  status: "loading" | "authenticated" | "unauthenticated";
  session: ReturnType<typeof useSession>["data"];
  compact?: boolean;
}) {
  const t = useT();

  if (status === "loading") {
    return <span className="text-sm text-[var(--color-muted)]">...</span>;
  }

  if (session) {
    return <UserMenu />;
  }

  return (
    <span className={`flex items-center ${compact ? "gap-1" : "gap-1 sm:gap-2"}`}>
      <Link
        href="/login"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-[var(--color-foreground)] transition hover:text-[var(--color-primary)] active:opacity-80 ${
          compact ? "px-1.5 py-1.5 text-xs" : "px-2.5 py-2 text-sm"
        }`}
      >
        <UserIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {t("header.login", "Log in")}
      </Link>
      <Link
        href="/register"
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-primary)] font-medium text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition hover:bg-[var(--color-primary-hover)] active:opacity-90 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        <PlusIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {t("header.register", "Create account")}
      </Link>
    </span>
  );
}

export function Header({
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  /** للطالب ذي اشتراك منصة نشط: نص تاريخ انتهاء الاشتراك (مُنسَّق من السيرفر) */
  platformSubscriptionExpiryLabel?: string | null;
}) {
  const { data: session, status } = useSession();
  const t = useT();
  const trimmedName = platformName?.trim() ?? "";
  const displayName = trimmedName;
  const linkTitle = trimmedName || t("header.homePage", "Homepage");

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)]/80 bg-white/95 shadow-[0_1px_0_rgb(0_0_0/0.03)] backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        {/* Mobile */}
        <div className="flex items-center justify-between gap-2 py-2.5 sm:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 truncate text-base font-bold text-[var(--color-primary)] transition hover:opacity-90"
              title={linkTitle}
            >
              {headerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerLogoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-background)] object-cover p-0.5"
                />
              ) : null}
              {displayName ? <span className="min-w-0 truncate">{displayName}</span> : null}
            </Link>
            <LanguageToggle />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MessageNotifications compact />
            <AuthActions status={status} session={session} compact />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[var(--color-border)]/70 py-2 sm:hidden">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          >
            {t("common.home", "Home")}
          </Link>
          <Link
            href="/courses"
            className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
          >
            {t("common.courses", "Courses")}
          </Link>
        </div>

        {/* Desktop */}
        <div className="hidden h-[72px] items-center justify-between gap-3 sm:flex">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex min-w-0 max-w-[45%] items-center gap-2 truncate text-lg font-bold text-[var(--color-primary)] transition hover:opacity-90 sm:max-w-[320px] sm:text-2xl md:max-w-none"
              title={linkTitle}
            >
              {headerLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerLogoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)] object-cover p-0.5 sm:h-14 sm:w-14"
                />
              ) : null}
              {displayName ? <span className="min-w-0 truncate">{displayName}</span> : null}
            </Link>
            <LanguageToggle />
          </div>

          <nav className="flex flex-shrink-0 items-center gap-5 md:gap-7">
            <Link
              href="/"
              className="text-base font-medium text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
            >
              {t("common.home", "Home")}
            </Link>
            <Link
              href="/courses"
              className="text-base font-medium text-[var(--color-muted)] transition hover:text-[var(--color-foreground)]"
            >
              {t("common.courses", "Courses")}
            </Link>
            <MessageNotifications />
            <AuthActions status={status} session={session} />
          </nav>
        </div>
      </div>
      {platformSubscriptionExpiryLabel ? (
        <div className="border-t border-teal-500/35 bg-gradient-to-l from-teal-950/80 to-slate-900/90 py-2.5 text-center text-xs leading-relaxed text-teal-50 sm:text-sm">
          <span className="font-semibold text-teal-200">{t("header.platformSubscriptionActive", "You are subscribed to the platform subscription")}</span>
          {" — "}
          <span className="text-teal-100/95">
            {t("header.endsAt", "Expires at:")} <time className="font-medium text-white">{platformSubscriptionExpiryLabel}</time>
          </span>
        </div>
      ) : null}
    </header>
  );
}
