import { Suspense } from "react";
import { preload } from "react-dom";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings, getPublishedCourseSlugsByIds } from "@/lib/db";
import { HomeHeroClassic } from "@/components/HomeHeroClassic";
import { HomeHeroImageSlider } from "@/components/HomeHeroImageSlider";
import { HomeHeroTemplateThree } from "@/components/HomeHeroTemplateThree";
import {
  HomePageBelowFold,
  HomePageBelowFoldFallback,
} from "@/components/HomePageBelowFold";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";

/** ISR: الكتالوج يُحدَّث تلقائياً؛ التغييرات من لوحة التحكم تُبطَل فوراً عبر revalidateTag */
export const revalidate = 60;

export default async function HomePage() {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);

  const [session, homepageSettings] = await Promise.all([
    getServerSession(authOptions),
    getHomepageSettings(),
  ]);

  const heroTemplate =
    homepageSettings.heroTemplate === "image_slider"
      ? "image_slider"
      : homepageSettings.heroTemplate === "coming_soon"
        ? "coming_soon"
        : "classic";

  const heroSliderSlots = [
    { src: homepageSettings.heroSliderImage1, courseId: homepageSettings.heroSliderCourseId1 ?? null },
    { src: homepageSettings.heroSliderImage2, courseId: homepageSettings.heroSliderCourseId2 ?? null },
    { src: homepageSettings.heroSliderImage3, courseId: homepageSettings.heroSliderCourseId3 ?? null },
    { src: homepageSettings.heroSliderImage4, courseId: homepageSettings.heroSliderCourseId4 ?? null },
    { src: homepageSettings.heroSliderImage5, courseId: homepageSettings.heroSliderCourseId5 ?? null },
  ];
  const sliderCourseIds = heroSliderSlots
    .map((s) => (s.courseId ? String(s.courseId).trim() : ""))
    .filter(Boolean);
  let sliderCourseSlugMap = new Map<string, string>();
  if (sliderCourseIds.length > 0) {
    try {
      sliderCourseSlugMap = await getPublishedCourseSlugsByIds(sliderCourseIds);
    } catch {
      sliderCourseSlugMap = new Map();
    }
  }
  const heroSliderSlides = heroSliderSlots
    .map((slot) => {
      const src = slot.src ? String(slot.src).trim() : "";
      if (!src) return null;
      const cid = slot.courseId ? String(slot.courseId).trim() : "";
      const slug = cid ? sliderCourseSlugMap.get(cid) : undefined;
      const href = slug ? `/courses/${slug}` : null;
      return { src, href };
    })
    .filter((s): s is { src: string; href: string | null } => s != null);

  const heroSliderIntervalMs =
    typeof homepageSettings.heroSliderIntervalMs === "number"
      ? homepageSettings.heroSliderIntervalMs
      : 5000;
  const heroTextAlignClass = locale === "en" ? "text-left" : "text-right";

  const classicTeacherSrc = homepageSettings.teacherImageUrl?.trim() || "/instructor.png";
  const classicTitle =
    pickLocalizedText(locale, homepageSettings.heroTitle, homepageSettings.heroTitleEn) ||
    t("home.defaultHeroTitle", "Mr. Essam Mohy");

  if (heroTemplate === "image_slider" && heroSliderSlides[0]?.src) {
    preload(heroSliderSlides[0].src, { as: "image" });
  } else if (heroTemplate === "classic") {
    preload(classicTeacherSrc, { as: "image" });
  }

  return (
    <div>
      {heroTemplate === "image_slider" ? (
        <section
          className="relative w-full overflow-hidden bg-[var(--color-background)]"
          aria-label={t("home.heroSliderAria", "Hero Slider")}
        >
          <HomeHeroImageSlider slides={heroSliderSlides} intervalMs={heroSliderIntervalMs} />
        </section>
      ) : heroTemplate === "coming_soon" ? (
        <HomeHeroTemplateThree
          title={pickLocalizedText(locale, homepageSettings.hero3Title, homepageSettings.hero3TitleEn) || t("home.defaultHero3Title", "The #1 all-in-one platform")}
          subtitle={pickLocalizedText(locale, homepageSettings.hero3Subtitle, homepageSettings.hero3SubtitleEn) || t("home.defaultHero3Subtitle", "Join over one million students with our plan")}
          phoneImageUrl={homepageSettings.hero3PhoneImageUrl?.trim() || null}
          phoneBgColor={homepageSettings.hero3PhoneBgColor?.trim() || "#FACC15"}
          badge1ImageUrl={homepageSettings.hero3StoreBadge1ImageUrl?.trim() || null}
          badge1Link={homepageSettings.hero3StoreBadge1Link?.trim() || null}
          badge2ImageUrl={homepageSettings.hero3StoreBadge2ImageUrl?.trim() || null}
          badge2Link={homepageSettings.hero3StoreBadge2Link?.trim() || null}
        />
      ) : (
        <HomeHeroClassic
          title={classicTitle}
          slogan={
            pickLocalizedText(locale, homepageSettings.heroSlogan, homepageSettings.heroSloganEn) ||
            t("home.defaultHeroSlogan", "Study it... and finally understand it right!")
          }
          teacherImageUrl={classicTeacherSrc}
          teacherAlt={classicTitle}
          ctaHref="/register"
          ctaLabel={t("home.classicCta", "Join us now")}
          badgeLabel={t("home.classicBadge", "Learn math in a scientific and fun way")}
          chipGeometry={t("home.classicChipGeometry", "Geometry")}
          chipAlgebra={t("home.classicChipAlgebra", "Algebra")}
          chipStatistics={t("home.classicChipStatistics", "Statistics")}
          textAlignClass={heroTextAlignClass}
          ariaLabel={t("home.heroAria", "Hero")}
        />
      )}

      <div id="home-next-section" className="scroll-mt-20" />

      <Suspense fallback={<HomePageBelowFoldFallback />}>
        <HomePageBelowFold homepageSettings={homepageSettings} session={session} />
      </Suspense>
    </div>
  );
}
