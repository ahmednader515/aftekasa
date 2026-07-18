import Link from "next/link";
import { GRADE_STAGES, type GradeStageSlug } from "@/lib/grade-stages";

export function HomeGradeStagesSection({
  title,
  subtitle,
  browseCta,
  courseCountLabel,
  allCoursesForLabel,
  fallbackImageUrl,
  imagesBySlug,
  countsBySlug,
  locale,
}: {
  title: string;
  subtitle: string;
  browseCta: string;
  /** Map count → display string already formatted */
  courseCountLabel: (count: number) => string;
  allCoursesForLabel: (gradeName: string) => string;
  fallbackImageUrl: string;
  imagesBySlug: Partial<Record<GradeStageSlug, string | null>>;
  countsBySlug: Partial<Record<GradeStageSlug, number>>;
  locale: string;
}) {
  return (
    <section
      className="grade-stages-section relative overflow-hidden px-4 py-16 sm:px-6"
      aria-labelledby="home-grades-heading"
    >
      <div className="grade-stages-section-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl text-start">
          <p className="text-xs font-bold tracking-[0.18em] text-[var(--color-primary)] uppercase">
            {locale === "en" ? "Levels" : "المراحل"}
          </p>
          <h2
            id="home-grades-heading"
            className="mt-2 text-3xl font-extrabold leading-tight text-[var(--color-foreground)] sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-3 text-base text-[var(--color-muted)] sm:text-lg">{subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {GRADE_STAGES.map((stage, index) => {
            const count = countsBySlug[stage.slug] ?? 0;
            const gradeName = locale === "en" ? stage.nameEn : stage.nameAr;
            const cardTitle = stage.shortLabel;
            const imageSrc = imagesBySlug[stage.slug]?.trim() || fallbackImageUrl;
            const orderLabel = String(index + 1).padStart(2, "0");
            return (
              <Link
                key={stage.slug}
                href={`/courses?category=${encodeURIComponent(stage.slug)}`}
                className="grade-stage-tile group outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              >
                <div className="grade-stage-tile-media relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt=""
                    className="h-full w-full object-cover object-[center_22%] transition duration-700 ease-out group-hover:scale-[1.04] group-hover:saturate-110"
                  />
                  <div className="grade-stage-tile-media-fade absolute inset-x-0 bottom-0 h-1/3" />
                  <span className="absolute start-3 top-3 font-mono text-3xl font-black leading-none text-white/25 transition duration-500 group-hover:text-white/40">
                    {orderLabel}
                  </span>
                </div>

                <div className="grade-stage-tile-body">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[var(--color-primary)]">
                      {courseCountLabel(count)}
                    </span>
                    <span
                      className="h-px flex-1 bg-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition duration-500 group-hover:bg-[var(--color-primary)]"
                      aria-hidden
                    />
                  </div>

                  <h3 className="mt-3 text-[1.55rem] font-extrabold leading-[1.2] tracking-tight text-[var(--color-foreground)] sm:text-[1.7rem]">
                    {cardTitle}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
                    {allCoursesForLabel(gradeName)}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] transition duration-300 group-hover:gap-3">
                    <span>{browseCta}</span>
                    <svg
                      className="h-4 w-4 transition duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
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
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
