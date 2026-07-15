import Link from "next/link";
import { getHomepageSettings } from "@/lib/db";
import { getDir } from "@/lib/i18n/core";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

export async function AuthSplitLayout({
  children,
  welcomeTitle,
  welcomeDescription,
  backHref = "/",
}: {
  children: React.ReactNode;
  welcomeTitle: string;
  welcomeDescription: string;
  backHref?: string;
}) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const contentDir = getDir(locale);
  let platformName = t("header.homePage", "Homepage");
  let logoUrl: string | null = null;
  try {
    const settings = await getHomepageSettings();
    platformName =
      pickLocalizedText(locale, settings.platformName, settings.platformNameEn)?.trim() ||
      platformName;
    logoUrl = settings.headerLogoUrl?.trim() || null;
  } catch {
    /* defaults */
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f3f4f6] px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="auth-split-card flex w-full max-w-[980px] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_25px_60px_-28px_rgb(15_23_42/0.28)]"
        dir="ltr"
      >
        {/* Form — left half of the card */}
        <div
          className="relative flex w-full flex-col bg-white lg:w-1/2"
          dir={contentDir}
        >
          {/* Physical left — does not flip with RTL */}
          <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
            <Link
              href={backHref}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={t("common.home", "Home")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-16 sm:px-10 lg:px-12">
            <div className="mx-auto w-full max-w-[380px]">{children}</div>
          </div>
        </div>

        {/* Brand — right half of the card */}
        <aside
          className="auth-brand-panel relative hidden min-h-[640px] w-1/2 flex-col items-center justify-center overflow-hidden px-10 py-16 lg:flex"
          dir={contentDir}
        >
          <div className="auth-brand-panel-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative z-10 flex max-w-[280px] flex-col items-center text-center">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_16px_40px_-14px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-2.5" />
              ) : (
                <span className="px-3 text-base font-extrabold leading-snug text-[var(--color-primary)]">
                  {platformName}
                </span>
              )}
            </div>
            <p className="mt-5 text-xl font-extrabold text-[var(--color-primary)]">{platformName}</p>
            <h2 className="mt-8 text-2xl font-extrabold leading-snug text-slate-800">
              {welcomeTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{welcomeDescription}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
