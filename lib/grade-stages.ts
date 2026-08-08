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
  {
    slug: "sec-3",
    nameAr: "الصف الثالث الثانوي",
    nameEn: "Secondary 3",
    shortLabel: "الصف الثالث الثانوي",
    order: 6,
  },
] as const;

export type GradeStageSlug = (typeof GRADE_STAGES)[number]["slug"];

export const GRADE_STAGE_SLUGS: readonly GradeStageSlug[] = GRADE_STAGES.map((s) => s.slug);

/**
 * Maps `User.grade` (signup / admin strings) → course category slug.
 * Includes aliases for secondary grades (signup uses short names; categories use "الصف …").
 */
const SIGNUP_GRADE_TO_STAGE_SLUG: Record<string, GradeStageSlug> = {
  "الصف الأول الاعدادي": "prep-1",
  "الصف الثاني الاعدادي": "prep-2",
  "الصف الثالث الاعدادي": "prep-3",
  "الأول الثانوي": "sec-1",
  "الصف الأول الثانوي": "sec-1",
  "الثاني الثانوي": "sec-2",
  "الصف الثاني الثانوي": "sec-2",
  "الثالث الثانوي": "sec-3",
  "الصف الثالث الثانوي": "sec-3",
};

export function isGradeStageSlug(slug: string | null | undefined): slug is GradeStageSlug {
  if (!slug?.trim()) return false;
  return (GRADE_STAGE_SLUGS as readonly string[]).includes(slug.trim());
}

export function getGradeStageBySlug(slug: string | null | undefined) {
  if (!slug?.trim()) return null;
  return GRADE_STAGES.find((s) => s.slug === slug.trim()) ?? null;
}

/** Resolve a student's stored grade string to the matching grade-stage category slug. */
export function signupGradeToStageSlug(grade: string | null | undefined): GradeStageSlug | null {
  if (!grade?.trim()) return null;
  return SIGNUP_GRADE_TO_STAGE_SLUG[grade.trim()] ?? null;
}

function courseCategorySlug(
  course: {
    category?: { slug?: string | null; nameAr?: string | null; name_ar?: string | null } | null;
    level?: string | null;
    grade?: string | null;
  },
): string | null {
  const fromCategory = course.category?.slug?.trim();
  if (fromCategory) return fromCategory;

  const nameAr = (course.category?.nameAr ?? course.category?.name_ar ?? "").trim();
  if (nameAr) {
    const byName = SIGNUP_GRADE_TO_STAGE_SLUG[nameAr];
    if (byName) return byName;
  }

  const levelOrGrade = (course.level ?? course.grade ?? "").trim();
  if (levelOrGrade) {
    return SIGNUP_GRADE_TO_STAGE_SLUG[levelOrGrade] ?? null;
  }
  return null;
}

/**
 * Keep only courses whose category matches the student's grade.
 * If the student has no resolvable grade, returns the list unchanged.
 */
export function filterCoursesByStudentGrade<
  T extends {
    category?: { slug?: string | null; nameAr?: string | null; name_ar?: string | null } | null;
    level?: string | null;
    grade?: string | null;
  },
>(courses: T[], grade: string | null | undefined): T[] {
  const slug = signupGradeToStageSlug(grade);
  if (!slug) return courses;
  return courses.filter((c) => courseCategorySlug(c) === slug);
}

type StudentCatalogSubscription = {
  categoryId: string | null;
  /** Empty = all paid courses in the plan category. */
  courseIds: string[];
};

/**
 * Student /courses catalog:
 * 1) Always limit to the student's grade stage.
 * 2) If an active plan lists specific courses → only those (still within grade).
 * 3) If plans unlock "all in section" (empty courseIds) → grade-matched courses only
 *    (optionally intersected with those plan categories when set).
 */
export function filterCoursesCatalogForStudent<
  T extends {
    id: string;
    categoryId?: string | null;
    category_id?: string | null;
    category?: {
      id?: string | null;
      slug?: string | null;
      nameAr?: string | null;
      name_ar?: string | null;
    } | null;
    level?: string | null;
    grade?: string | null;
  },
>(
  courses: T[],
  grade: string | null | undefined,
  subscriptions: StudentCatalogSubscription[],
): T[] {
  const byGrade = filterCoursesByStudentGrade(courses, grade);
  if (subscriptions.length === 0) return byGrade;

  const anyAllInCategory = subscriptions.some((s) => s.courseIds.length === 0);
  const specificIds = new Set(
    subscriptions.flatMap((s) => s.courseIds.map((id) => String(id).trim()).filter(Boolean)),
  );

  if (!anyAllInCategory && specificIds.size > 0) {
    return byGrade.filter((c) => specificIds.has(String(c.id)));
  }

  if (anyAllInCategory && specificIds.size > 0) {
    const planCategoryIds = new Set(
      subscriptions
        .filter((s) => s.courseIds.length === 0)
        .map((s) => s.categoryId)
        .filter((id): id is string => !!id?.trim()),
    );
    return byGrade.filter((c) => {
      if (specificIds.has(String(c.id))) return true;
      if (planCategoryIds.size === 0) return true;
      const catId = String(c.categoryId ?? c.category_id ?? c.category?.id ?? "").trim();
      return !!catId && planCategoryIds.has(catId);
    });
  }

  // Only "all in category" plans: keep grade list, restrict to plan categories when present.
  const planCategoryIds = new Set(
    subscriptions.map((s) => s.categoryId).filter((id): id is string => !!id?.trim()),
  );
  if (planCategoryIds.size === 0) return byGrade;
  return byGrade.filter((c) => {
    const catId = String(c.categoryId ?? c.category_id ?? c.category?.id ?? "").trim();
    return !!catId && planCategoryIds.has(catId);
  });
}
