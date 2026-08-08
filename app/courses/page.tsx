import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCoursesPublishedCached } from "@/lib/public-data-cache";
import {
  getTeacherIdsExcludedFromPublicCourseLists,
  getUserById,
  ensureGradeCategories,
  listActivePlatformSubscriptionsForUser,
} from "@/lib/db";
import { courseIsHiddenFromPublicTeacherCatalog } from "@/lib/permissions";
import { TeacherCoursesSearch, type TeacherCourseListItem } from "./TeacherCoursesSearch";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { filterCoursesCatalogForStudent, getGradeStageBySlug } from "@/lib/grade-stages";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getServerTranslator();
  return {
    title: `${t("common.courses", "Courses")} | ${t("footer.defaultTitle", "My Learning Platform")}`,
    description: t("courses.allCoursesSubtitle", "Choose the right course and start learning step by step"),
  };
}

type Props = { searchParams: Promise<{ category?: string; teacher?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const [t, locale, session] = await Promise.all([
    getServerTranslator(),
    getLocaleFromCookie(),
    getServerSession(authOptions),
  ]);
  const { category: categorySlug, teacher: teacherId } = await searchParams;
  try {
    await ensureGradeCategories();
  } catch {
    /* DB not ready */
  }

  let courses: Awaited<ReturnType<typeof getCoursesPublishedCached>> = [];
  try {
    courses = await getCoursesPublishedCached(true);
  } catch {
    // DB not connected
  }

  const hideTeacherCreators = await getTeacherIdsExcludedFromPublicCourseLists();

  let teacherName: string | null = null;
  const tid = teacherId?.trim();
  if (tid) {
    const u = await getUserById(tid).catch(() => null);
    if (!u || u.role !== "TEACHER") {
      redirect("/courses");
    }
    teacherName = u.name ?? null;
  }

  const gradeStage = getGradeStageBySlug(categorySlug);

  let filtered =
    categorySlug?.trim()
      ? courses.filter((c) => (c as { category?: { slug?: string } }).category?.slug === categorySlug.trim())
      : courses;

  if (tid) {
    filtered = filtered.filter((c) => {
      const row = c as {
        createdById?: string | null;
        created_by_id?: string | null;
        assignedTeacherId?: string | null;
        assigned_teacher_id?: string | null;
      };
      const creator = row.createdById ?? row.created_by_id ?? null;
      const assigned = row.assignedTeacherId ?? row.assigned_teacher_id ?? null;
      return creator === tid || assigned === tid;
    });
  } else if (hideTeacherCreators.size > 0) {
    filtered = filtered.filter(
      (c) => !courseIsHiddenFromPublicTeacherCatalog(c, hideTeacherCreators),
    );
  }

  if (session?.user?.role === "STUDENT" && session.user.id) {
    const [student, subscriptions] = await Promise.all([
      getUserById(session.user.id).catch(() => null),
      listActivePlatformSubscriptionsForUser(session.user.id).catch(() => []),
    ]);
    filtered = filterCoursesCatalogForStudent(
      filtered as Array<{
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
      }>,
      student?.grade,
      subscriptions.map((s) => ({ categoryId: s.categoryId, courseIds: s.courseIds })),
    ) as typeof filtered;
  }

  const categoryNameFromCourse =
    categorySlug && filtered.length > 0
      ? pickLocalizedText(
          locale,
          (filtered[0] as { category?: { nameAr?: string | null; name?: string | null } }).category?.nameAr ?? null,
          (filtered[0] as { category?: { name?: string | null } }).category?.name ?? null,
        )
      : null;

  const gradeName = gradeStage
    ? locale === "en"
      ? gradeStage.nameEn
      : gradeStage.nameAr
    : null;

  const categoryName = gradeName || categoryNameFromCourse;

  const pageTitle = teacherName
    ? `${t("courses.teacherCoursesPrefix", "Courses by")} ${teacherName}`
    : gradeName
      ? `${t("courses.gradeCoursesPrefix", "Courses for")} ${gradeName}`
      : categoryName
        ? `${t("courses.categoryCoursesPrefix", "Category courses:")} ${categoryName}`
        : t("courses.allCoursesTitle", "All courses");

  const pageSubtitle = teacherName
    ? t("courses.teacherCoursesSubtitle", "Published courses by this teacher on the platform")
    : gradeName
      ? t("courses.gradeCoursesSubtitle", "Published courses for this educational stage")
      : categoryName
        ? t("courses.categoryCoursesSubtitle", "Courses for the selected category only")
        : t("courses.allCoursesSubtitle", "Choose the right course and start learning step by step");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{pageTitle}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{pageSubtitle}</p>
      </div>

      {filtered.length > 0 ? (
        <TeacherCoursesSearch
          courses={filtered as TeacherCourseListItem[]}
          groupByCategory={!!tid}
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <p className="text-[var(--color-muted)]">
            {tid
              ? t("courses.noTeacherCourses", "No published courses for this teacher right now.")
              : categorySlug?.trim()
                ? t("courses.noCategoryCourses", "No courses in this category right now.")
                : t("courses.noCourses", "No published courses yet. Make sure the database is configured and seed is run.")}
          </p>
        </div>
      )}
    </div>
  );
}
