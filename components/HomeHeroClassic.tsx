import Link from "next/link";

const MATH_GLYPHS = [
  { char: "%", className: "home-hero-classic-glyph-1" },
  { char: "√", className: "home-hero-classic-glyph-2" },
  { char: "Σ", className: "home-hero-classic-glyph-3" },
  { char: "+", className: "home-hero-classic-glyph-4" },
  { char: "×", className: "home-hero-classic-glyph-5" },
  { char: "−", className: "home-hero-classic-glyph-6" },
] as const;

export function HomeHeroClassic({
  title,
  slogan,
  teacherImageUrl,
  teacherAlt,
  ctaHref,
  ctaLabel,
  badgeLabel,
  chipGeometry,
  chipAlgebra,
  chipStatistics,
  textAlignClass,
  ariaLabel,
}: {
  title: string;
  slogan: string;
  teacherImageUrl: string;
  teacherAlt: string;
  ctaHref: string;
  ctaLabel: string;
  badgeLabel: string;
  chipGeometry: string;
  chipAlgebra: string;
  chipStatistics: string;
  textAlignClass: string;
  ariaLabel: string;
}) {
  return (
    <section
      className="home-hero-classic relative flex min-h-[min(100vh,920px)] w-full items-center overflow-x-clip overflow-y-visible"
      aria-label={ariaLabel}
    >
      <div className="home-hero-classic-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-16">
          <div className={`w-full flex-1 ${textAlignClass} order-2 lg:order-1 lg:max-w-xl`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[color-mix(in_srgb,var(--color-primary)_10%,white)] px-3.5 py-1.5 text-sm font-semibold text-[var(--color-primary)]">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 19.5A2.5 2.5 0 016.5 17H20"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 2H20v15H6.5A2.5 2.5 0 004 14.5v-10A2.5 2.5 0 016.5 2z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {badgeLabel}
            </span>

            <h1 className="home-hero-classic-title mt-5 text-4xl font-black leading-[1.2] text-[var(--color-primary)] sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
              {title}
            </h1>

            <p className="mt-5 max-w-lg whitespace-pre-line text-base font-medium leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
              {slogan}
            </p>

            <div className="mt-8">
              <Link
                href={ctaHref}
                className="home-hero-classic-cta inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-base font-bold text-white transition hover:bg-[var(--color-primary-hover)] active:scale-[0.98] sm:text-lg"
              >
                {ctaLabel}
                <span aria-hidden>🚀</span>
              </Link>
            </div>
          </div>

          <div className="order-1 flex w-full flex-shrink-0 justify-center lg:order-2 lg:w-auto lg:justify-end">
            {/* Extra padding so floating chips sit outside the circle without clipping */}
            <div className="home-hero-classic-visual relative h-[320px] w-[320px] sm:h-[400px] sm:w-[400px] lg:h-[460px] lg:w-[460px]">
              <div className="home-hero-classic-glow pointer-events-none absolute inset-[8%] rounded-full" aria-hidden />

              <div className="home-hero-classic-dash-ring pointer-events-none absolute inset-[10%] rounded-full" aria-hidden />

              <div className="absolute inset-[16%] overflow-hidden rounded-full border-[3px] border-[var(--color-primary)] bg-white shadow-[0_20px_50px_-12px_rgb(0_0_0/0.15)]">
                <div className="home-hero-classic-portrait-bg absolute inset-0" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element -- R2 originals can be large; next/image optimizer times out */}
                <img
                  src={teacherImageUrl}
                  alt={teacherAlt}
                  width={400}
                  height={400}
                  decoding="async"
                  fetchPriority="high"
                  className="absolute inset-0 z-[1] h-full w-full object-cover object-top"
                />
              </div>

              {MATH_GLYPHS.map(({ char, className }) => (
                <span
                  key={className}
                  className={`home-hero-classic-glyph pointer-events-none absolute select-none font-bold text-[var(--color-primary)]/70 ${className}`}
                  aria-hidden
                >
                  {char}
                </span>
              ))}

              <span className="home-hero-classic-chip home-hero-classic-chip-1">
                <span aria-hidden>📐</span>
                {chipGeometry}
              </span>
              <span className="home-hero-classic-chip home-hero-classic-chip-2">
                <span aria-hidden>➕</span>
                {chipAlgebra}
              </span>
              <span className="home-hero-classic-chip home-hero-classic-chip-3">
                <span aria-hidden>📊</span>
                {chipStatistics}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
