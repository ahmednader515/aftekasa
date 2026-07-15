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
    <section className="bg-[var(--color-background)] px-4 py-16 sm:px-6" aria-labelledby="home-grades-heading">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2
            id="home-grades-heading"
            className="text-3xl font-extrabold text-[var(--color-foreground)] sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[var(--color-muted)] sm:text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GRADE_STAGES.map((stage) => {
            const count = countsBySlug[stage.slug] ?? 0;
            const gradeName = locale === "en" ? stage.nameEn : stage.nameAr;
            const cardTitle = stage.shortLabel;
            const imageSrc = imagesBySlug[stage.slug]?.trim() || fallbackImageUrl;
            return (
              <Link
                key={stage.slug}
                href={`/courses?category=${encodeURIComponent(stage.slug)}`}
                className="grade-stage-card group relative flex min-h-[250px] overflow-hidden rounded-2xl shadow-[0_14px_36px_-18px_rgb(0_0_0/0.45)] outline-none transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-16px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:min-h-[270px]"
              >
                {/* Full-bleed card image */}
                <div className="absolute inset-0" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt=""
                    className="h-full w-full object-cover object-[center_20%] transition duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="grade-stage-card-scrim absolute inset-0" />
                </div>

                <div className="relative z-[1] flex w-full flex-col justify-between p-5 sm:p-6">
                  <div className="flex justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] shadow-sm">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M4 6.5A2.5 2.5 0 016.5 4H18a1 1 0 011 1v14a1 1 0 01-1 1H6.5A2.5 2.5 0 014 17.5v-11z" />
                      </svg>
                      {courseCountLabel(count)}
                    </span>
                  </div>

                  <div className="mt-auto max-w-[85%] text-start">
                    <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-[1.7rem]">
                      {cardTitle}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/90 sm:text-[0.95rem]">
                      {allCoursesForLabel(gradeName)}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-white transition group-hover:text-[var(--color-primary)]">
                        {browseCta}
                      </span>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-md transition group-hover:bg-[var(--color-primary-hover)] group-hover:scale-105">
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
          })}
        </div>
      </div>
    </section>
  );
}
