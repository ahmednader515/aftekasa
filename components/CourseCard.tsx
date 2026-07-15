"use client";

import Link from "next/link";
import { useT } from "./LocaleProvider";

function normalizeCoursePrice(
  price: number | { toNumber?: () => number } | string | undefined,
): number | null {
  if (price === undefined || price === null || price === "") return null;
  if (typeof price === "object" && price !== null && typeof price.toNumber === "function") {
    const n = price.toNumber();
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

type Course = {
  id: string;
  title: string;
  titleAr?: string | null;
  slug?: string | null;
  shortDesc?: string | null;
  shortDescEn?: string | null;
  duration?: string | null;
  level?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  price?: number | { toNumber?: () => number } | string;
  courseRating?: number | { toNumber?: () => number } | string | null;
  courseRatingCount?: number | { toNumber?: () => number } | string | null;
  category?: { name: string; nameAr?: string | null } | null;
};

export function CourseCard({ course }: { course: Course }) {
  const t = useT();
  const displayTitle = course.titleAr || course.title;
  const categoryName = course.category?.nameAr || course.category?.name;
  const shortDescription = course.shortDesc || course.shortDescEn;
  const slugOrId = course.slug && course.slug.trim() ? encodeURIComponent(course.slug.trim()) : course.id;
  const href = slugOrId ? `/courses/${slugOrId}` : "/courses";
  const priceValue = normalizeCoursePrice(course.price);
  const courseRatingValue = normalizeCoursePrice(course.courseRating ?? undefined);
  const courseRatingCountValue = normalizeCoursePrice(course.courseRatingCount ?? undefined);
  const hasCourseRating =
    courseRatingValue !== null &&
    courseRatingValue > 0 &&
    courseRatingCountValue !== null &&
    courseRatingCountValue > 0;
  const priceDisplay =
    priceValue !== null && priceValue > 0 ? priceValue.toFixed(2) : null;
  const isPaid = priceDisplay !== null;

  const imageSrc = course.imageUrl ?? course.image_url ?? null;
  const badgeLabel = isPaid
    ? `${priceDisplay} ${t("common.egyptianPoundShort", "EGP")}`
    : t("common.free", "Free");

  return (
    <Link
      href={href}
      className="group relative flex min-h-[250px] overflow-hidden rounded-2xl shadow-[0_14px_36px_-18px_rgb(0_0_0/0.45)] outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-16px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:min-h-[270px]"
    >
      <div className="absolute inset-0" aria-hidden>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover object-[center_20%] transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary)]/40 via-slate-900 to-black" />
        )}
        <div className="grade-stage-card-scrim absolute inset-0" />
      </div>

      <div className="relative z-[1] flex w-full flex-col justify-between p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] shadow-sm">
            {badgeLabel}
          </span>
          {hasCourseRating ? (
            <span className="inline-flex items-center rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
              ★ {courseRatingValue.toFixed(1)} ({Math.round(courseRatingCountValue)})
            </span>
          ) : null}
        </div>

        <div className="mt-auto max-w-[90%] text-start">
          {categoryName ? (
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)] sm:text-sm">
              {categoryName}
            </p>
          ) : null}
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-2xl">
            {displayTitle}
          </h3>
          {shortDescription ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/90">
              {shortDescription}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-white transition group-hover:text-[var(--color-primary)]">
              {t("courses.viewCourse", "View course")}
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-md transition group-hover:scale-105 group-hover:bg-[var(--color-primary-hover)]">
              <svg
                className="h-4 w-4 rtl:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
