"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/constants";
import { useLocale, useT } from "./LocaleProvider";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";
  const isArabic = locale === "ar";

  function handleToggle() {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      dir="ltr"
      onClick={handleToggle}
      className="relative inline-flex h-8 w-[3.4rem] shrink-0 items-center rounded-full bg-[#e9e4d4] px-1 transition hover:bg-[#e2dcc8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
      aria-label={nextLocale === "ar" ? t("lang.switchToAr", "Switch to Arabic") : t("lang.switchToEn", "Switch to English")}
      title={nextLocale === "ar" ? t("lang.switchToAr", "Switch to Arabic") : t("lang.switchToEn", "Switch to English")}
    >
      <span
        className={`pointer-events-none absolute inset-y-0 left-1.5 flex items-center text-[10px] font-bold text-[#8a8474] transition-opacity ${
          isArabic ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        EN
      </span>
      <span
        className={`pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-[11px] font-bold text-[#8a8474] transition-opacity ${
          isArabic ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        ع
      </span>
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#2f2f2f] text-[10px] font-bold text-white shadow-sm transition-transform duration-200 ease-out ${
          isArabic ? "translate-x-0" : "translate-x-[1.35rem]"
        }`}
      >
        {isArabic ? "ع" : "EN"}
      </span>
    </button>
  );
}
