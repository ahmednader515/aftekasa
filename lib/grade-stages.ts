/** Fixed homepage / course “المراحل الدراسية” stages (always-on Category rows). */

export const GRADE_STAGES = [
  {
    slug: "prep-1",
    nameAr: "الصف الأول الاعدادي",
    nameEn: "الصف الأول الاعدادي",
    shortLabel: "الصف الأول الاعدادي",
    order: 1,
  },
  {
    slug: "prep-2",
    nameAr: "الصف الثاني الاعدادي",
    nameEn: "الصف الثاني الاعدادي",
    shortLabel: "الصف الثاني الاعدادي",
    order: 2,
  },
  {
    slug: "prep-3",
    nameAr: "الصف الثالث الاعدادي",
    nameEn: "الصف الثالث الاعدادي",
    shortLabel: "الصف الثالث الاعدادي",
    order: 3,
  },
  {
    slug: "sec-1",
    nameAr: "الصف الأول الثانوي",
    nameEn: "Secondary 1",
    shortLabel: "الصف الأول الثانوي",
    order: 4,
  },
  {
    slug: "sec-2",
    nameAr: "الصف الثاني الثانوي",
    nameEn: "Secondary 2",
    shortLabel: "الصف الثاني الثانوي",
    order: 5,
  },
] as const;

export type GradeStageSlug = (typeof GRADE_STAGES)[number]["slug"];

export const GRADE_STAGE_SLUGS: readonly GradeStageSlug[] = GRADE_STAGES.map((s) => s.slug);

export function isGradeStageSlug(slug: string | null | undefined): slug is GradeStageSlug {
  if (!slug?.trim()) return false;
  return (GRADE_STAGE_SLUGS as readonly string[]).includes(slug.trim());
}

export function getGradeStageBySlug(slug: string | null | undefined) {
  if (!slug?.trim()) return null;
  return GRADE_STAGES.find((s) => s.slug === slug.trim()) ?? null;
}
