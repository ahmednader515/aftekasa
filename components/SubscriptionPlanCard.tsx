"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type SubscriptionPlanCardData = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  durationKind: string;
  price: number;
  categoryId: string | null;
  categoryName: string | null;
};

export type ActiveSubscriptionForPlan = {
  categoryId: string | null;
  expiresAtIso: string;
};

function findActiveSubscriptionForPlan(
  plan: SubscriptionPlanCardData,
  activeSubscriptions: ActiveSubscriptionForPlan[],
): ActiveSubscriptionForPlan | null {
  return (
    activeSubscriptions.find((sub) => {
      if (plan.categoryId) return sub.categoryId === plan.categoryId;
      return sub.categoryId == null;
    }) ?? null
  );
}

function durationLabel(kind: string): string {
  if (kind === "week") return "أسبوع";
  if (kind === "month") return "شهر";
  if (kind === "year") return "سنة";
  return kind;
}

const ADD_BALANCE_HREF = "/dashboard/add-balance";

function formatRenewalDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function SubscriptionPlanCard({
  plan,
  isStudent,
  isLoggedIn,
  activeSubscriptions = [],
}: {
  plan: SubscriptionPlanCardData;
  isStudent: boolean;
  isLoggedIn: boolean;
  /** اشتراكات نشطة للطالب (قد يكون أكثر من قسم) */
  activeSubscriptions?: ActiveSubscriptionForPlan[];
  /** @deprecated استخدم activeSubscriptions */
  hasActivePlatformSubscription?: boolean;
  /** @deprecated استخدم activeSubscriptions */
  activePlatformSubscriptionExpiresAtIso?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showAddBalanceLink, setShowAddBalanceLink] = useState(false);
  const [successExpiresAt, setSuccessExpiresAt] = useState<string | null>(null);

  const activeForPlan = findActiveSubscriptionForPlan(plan, activeSubscriptions);
  const hasActivePlatformSubscription = !!activeForPlan;
  const activePlatformSubscriptionExpiresAtIso = activeForPlan?.expiresAtIso ?? null;

  const activeSubExpiryFormatted =
    hasActivePlatformSubscription && activePlatformSubscriptionExpiresAtIso
      ? formatRenewalDate(activePlatformSubscriptionExpiresAtIso)
      : null;

  async function purchase() {
    setErr("");
    setInfoMessage("");
    setShowAddBalanceLink(false);
    setSuccessExpiresAt(null);
    if (isStudent && hasActivePlatformSubscription) {
      const line = activeSubExpiryFormatted
        ? `اشتراكك في قسم «${plan.categoryName ?? "هذه الباقة"}» نشط حتى ${activeSubExpiryFormatted}. `
        : `لديك اشتراك نشط لقسم «${plan.categoryName ?? "هذه الباقة"}». `;
      setInfoMessage(
        `${line}لا تحتاج لدفع هذه الباقة مرة أخرى قبل انتهاء المدة.`,
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscriptions/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      let data: {
        success?: boolean;
        expiresAt?: string;
        error?: string;
        insufficientBalance?: boolean;
        alreadySubscribed?: boolean;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        if (data.alreadySubscribed && typeof data.error === "string") {
          setInfoMessage(data.error);
        } else {
          setErr(typeof data.error === "string" ? data.error : "تعذر إتمام الشراء");
          setShowAddBalanceLink(!!data.insufficientBalance);
        }
        return;
      }
      if (typeof data.expiresAt !== "string" || !data.expiresAt.trim()) {
        setErr(
          "تم تنفيذ الطلب لكن لم يُرجع الخادم تاريخ انتهاء الاشتراك. إن خُصم من رصيدك، راجع لوحة التحكم أو أعد تحميل الصفحة.",
        );
        router.refresh();
        return;
      }
      setSuccessExpiresAt(data.expiresAt.trim());
      router.refresh();
    } catch {
      setErr("تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.");
    } finally {
      setLoading(false);
    }
  }

  const priceStr = Number(plan.price).toFixed(0);
  const loginHref = `/login?callbackUrl=${encodeURIComponent("/")}`;

  return (
    <article
      className="subscription-plan-card mx-auto flex max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
      dir="rtl"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[var(--color-background)]">
        {plan.imageUrl ? (
          <img src={plan.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        {isStudent && hasActivePlatformSubscription ? (
          <div
            className="pointer-events-none absolute left-3 top-3 z-[1] rounded-full border border-emerald-500/40 bg-emerald-600 px-3 py-1 text-center text-[11px] font-bold text-white shadow-md sm:text-xs"
            aria-hidden
          >
            مشترك
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute right-0 top-0 z-[1] origin-top-right translate-x-1/4 -translate-y-1/4 rotate-45 bg-[var(--color-primary)] px-10 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
          aria-hidden
        >
          اشتراك
        </div>
      </div>

      <div className="relative z-[2] -mt-8 rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-6 pt-12 sm:px-6 sm:pt-14">
        <div className="absolute left-1/2 top-0 z-[3] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border-2 border-amber-400 bg-gradient-to-b from-amber-400 to-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg sm:px-8 sm:py-3 sm:text-base">
          {durationLabel(plan.durationKind)}
        </div>

        <div className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-right text-xl font-bold leading-snug text-[var(--color-foreground)]">
              {plan.name}
            </h3>
            {plan.categoryName ? (
              <p className="text-right text-xs font-medium text-[var(--color-primary)]">
                قسم: {plan.categoryName}
              </p>
            ) : null}
            {isStudent && hasActivePlatformSubscription ? (
              <p className="text-right text-xs leading-relaxed text-emerald-700">
                {activeSubExpiryFormatted ? (
                  <>
                    أنت مشترك في اشتراك المنصة حتى{" "}
                    <span className="font-semibold text-emerald-800">{activeSubExpiryFormatted}</span>
                    . لا يلزم دفع هذه الباقة مرة أخرى قبل انتهاء المدة.
                  </>
                ) : (
                  <>أنت مشترك في اشتراك المنصة. لا يلزم دفع هذه الباقة مرة أخرى قبل انتهاء المدة الحالية.</>
                )}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2.5">
            {isStudent ? (
              <Link
                href="/courses"
                className="rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5"
              >
                الكورسات
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/5"
              >
                تسجيل الدخول
              </Link>
            )}
            {isStudent ? (
              <button
                type="button"
                onClick={purchase}
                disabled={loading}
                className={`min-w-[9.5rem] rounded-xl px-5 py-3.5 text-center text-sm font-bold shadow-md transition sm:min-w-[10.5rem] sm:px-6 sm:py-4 sm:text-base ${
                  hasActivePlatformSubscription
                    ? "border border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                }`}
              >
                {loading
                  ? "جاري الشراء…"
                  : hasActivePlatformSubscription
                    ? "أنت مشترك — التفاصيل"
                    : "اشتر الآن"}
              </button>
            ) : isLoggedIn ? (
              <span className="rounded-xl bg-[var(--color-background)] px-3 py-2 text-center text-[10px] text-[var(--color-muted)]">
                للطلاب فقط
              </span>
            ) : (
              <Link
                href={loginHref}
                className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-center text-xs font-semibold text-white shadow-md transition hover:bg-[var(--color-primary-hover)]"
              >
                اشتر كطالب
              </Link>
            )}
          </div>
        </div>

        <div className="my-4 space-y-2">
          <div className="h-px w-full bg-[var(--color-primary)]/40" />
          <div className="h-px w-full bg-[var(--color-border)]" />
        </div>

        {plan.description?.trim() ? (
          <p className="text-right text-sm leading-relaxed text-[var(--color-muted)]">
            {plan.description.trim()}
          </p>
        ) : (
          <p className="text-right text-sm text-[var(--color-muted)]">
            {plan.categoryName
              ? `وصول لكل الكورسات المدفوعة المنشورة في قسم «${plan.categoryName}» طوال مدة الاشتراك.`
              : "وصول لكل الكورسات المدفوعة المنشورة طوال مدة الاشتراك."}
          </p>
        )}

        <div className="mt-6 flex flex-row items-end justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <div className="space-y-1 text-right text-xs text-[var(--color-muted)]">
            <p className="flex items-center justify-end gap-1.5">
              <span>{plan.categoryName ? `كورسات قسم ${plan.categoryName}` : "وصول شامل للمدفوع"}</span>
              <span aria-hidden>◷</span>
            </p>
            <p className="flex items-center justify-end gap-1.5">
              <span>{plan.categoryName ?? "قسم محدد"}</span>
              <span aria-hidden>▤</span>
            </p>
          </div>
          <div className="flex shrink-0 items-stretch overflow-hidden rounded-lg text-sm font-bold shadow-sm ring-1 ring-[var(--color-border)]">
            <span className="flex items-center bg-[var(--color-primary)] px-2.5 py-2 text-white">ج.م</span>
            <span className="flex items-center bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)] tabular-nums">
              {priceStr}
            </span>
          </div>
        </div>

        {infoMessage ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm leading-relaxed text-amber-900">
            {infoMessage}
          </div>
        ) : null}

        {successExpiresAt ? (
          <div
            className="mt-4 space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center"
            role="status"
          >
            <p className="text-base font-bold text-emerald-800">تم الاشتراك بنجاح</p>
            <p className="text-sm leading-relaxed text-emerald-900/90">
              موعد انتهاء اشتراكك الحالي (وبداية دورة التجديد التالية إن رغبت بالتمديد):{" "}
              <span className="block pt-1 font-semibold text-emerald-950 sm:inline sm:pt-0">
                {formatRenewalDate(successExpiresAt)}
              </span>
            </p>
            <p className="text-xs leading-relaxed text-emerald-800/85">
              يمكنك الآن فتح الكورسات المدفوعة المنشورة
              {plan.categoryName ? ` في قسم «${plan.categoryName}»` : ""} دون شراء كل كورس على حدة حتى هذا التاريخ.
            </p>
            <Link
              href="/courses"
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[var(--color-primary-hover)]"
            >
              الانتقال إلى الكورسات
            </Link>
          </div>
        ) : null}

        {err ? (
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm text-red-600">{err}</p>
            {showAddBalanceLink ? (
              <Link
                href={ADD_BALANCE_HREF}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/15"
              >
                إضافة رصيد في حسابك
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
