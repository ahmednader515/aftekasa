import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  hasFullCourseAccessAsStudent,
  ensureUserCopyrightCode,
  getHomepageSettings,
  isLessonCompleteForUser,
  hasHomeworkSubmissionForLesson,
  getCourseIdByLessonSlug,
} from "@/lib/db";
import { LessonWatchShell } from "@/components/LessonWatchShell";
import { VideoCopyrightOverlay } from "@/components/video-copyright-overlay";
import { getYouTubeVideoId } from "@/lib/youtube";
import { CourseOutlineSidebar } from "@/components/CourseOutlineSidebar";
import { LessonHomeworkSection } from "./LessonHomeworkSection";
import { LessonRatingSection } from "./LessonRatingSection";
import { LessonHomeworkMaterialsPanel } from "./LessonHomeworkMaterialsPanel";
import { parseHomeworkMaterials } from "@/lib/homework-materials";
import { resolveCourseProgression, shouldApplySequentialProgression } from "@/lib/course-progression-server";
import { findProgressionRowForLesson } from "@/lib/course-progression";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { isCourseSegmentId } from "@/lib/legacy-schema";
import { prepareLessonContentForDisplay } from "@/lib/lesson-content";
import { CourseContentAccessDenied } from "@/components/CourseContentAccessDenied";
import { LessonAttachmentPreview } from "@/components/LessonAttachmentPreview";

type Props = { params: Promise<{ slug: string; lessonSlug: string }> };

function decodeSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function isLessonId(segment: string): boolean {
  return isCourseSegmentId(segment);
}

function courseHref(course: { slug?: string | null; id: string }): string {
  const segment = (course.slug && course.slug.trim()) ? encodeURIComponent(course.slug.trim()) : course.id;
  return `/courses/${segment}`;
}

function courseSeg(course: { slug?: string | null; id: string }): string {
  const s = (course.slug && course.slug.trim()) ? String(course.slug).trim() : "";
  return s ? encodeURIComponent(s) : (course as { id: string }).id;
}

function lessonHref(course: { slug?: string | null; id: string }, lesson: { slug?: string | null; id: string }): string {
  const seg = courseSeg(course);
  const lessonSeg = (lesson.slug && lesson.slug.trim()) ? encodeURIComponent(lesson.slug.trim()) : lesson.id;
  return `/courses/${seg}/lessons/${lessonSeg}`;
}

function quizHref(course: { slug?: string | null; id: string }, quizId: string): string {
  return `/courses/${courseSeg(course)}/quizzes/${encodeURIComponent(quizId)}`;
}

type NavItem =
  | { type: "lesson"; id: string; slug?: string | null; locked: boolean }
  | { type: "quiz"; id: string; locked: boolean };

export default async function LessonPage({ params }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { slug: courseSegment, lessonSlug: lessonSegment } = await params;
  const courseDecoded = decodeSegment(courseSegment);
  const lessonDecoded = decodeSegment(lessonSegment);
  const session = await getServerSession(authOptions);

  let data = await getCourseWithContent(courseDecoded);
  let lesson =
    data?.course && data.lessons
      ? isLessonId(lessonDecoded)
        ? data.lessons.find((l: Record<string, unknown>) => l.id === lessonDecoded)
        : data.lessons.find((l: Record<string, unknown>) => l.slug === lessonDecoded)
      : undefined;

  // إذا وُجدت الحصة تحت دورة أخرى (مثلاً slug الدورة ينتهي بشرطة وحُذفت من الرابط)
  if (!lesson && !isLessonId(lessonDecoded)) {
    const ownerCourseId = await getCourseIdByLessonSlug(lessonDecoded);
    if (ownerCourseId) {
      data = await getCourseWithContent(ownerCourseId);
      lesson = data?.lessons.find((l: Record<string, unknown>) => l.slug === lessonDecoded);
    }
  }

  if (!data?.course) notFound();

  const course = data.course as unknown as Record<string, unknown> & { id: string; slug?: string | null; lessons: Record<string, unknown>[]; quizzes?: Array<Record<string, unknown> & { _count?: { questions?: number } }> };
  course.lessons = data.lessons;
  const role = session?.user?.role;
  course.quizzes = data.quizzes ?? [];

  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  const isStudent = role === "STUDENT";
  let isEnrolled = false;
  let allowedLessonIds: string[] = [];
  let hasFullStudentAccess = false;
  if (session?.user?.id) {
    const en = await getEnrollment(session.user.id, course.id);
    isEnrolled = !!en;
    if (session.user.role === "STUDENT") {
      hasFullStudentAccess = await hasFullCourseAccessAsStudent(session.user.id, course.id);
    }
    if (!isEnrolled && !isStaff && !hasFullStudentAccess) {
      allowedLessonIds = await getAllowedLessonIdsForUserCourse(session.user.id, course.id);
    }
  }
  const canAccessCourse =
    isStaff || isEnrolled || hasFullStudentAccess || allowedLessonIds.length > 0;
  if (!canAccessCourse) notFound();

  if (!lesson) notFound();

  // صحّح الرابط إذا كان slug الدورة في العنوان لا يطابق الدورة الفعلية للحصة
  const canonicalCourseSeg = course.slug?.trim() || course.id;
  if (courseDecoded !== canonicalCourseSeg && courseDecoded !== course.id) {
    redirect(lessonHref(course, lesson as { slug?: string | null; id: string }));
  }

  const lessonObj = lesson as Record<string, unknown>;
  const lessonId = String(lessonObj.id ?? lesson.id);

  const courseAr =
    course.titleAr != null
      ? String(course.titleAr)
      : course.title_ar != null
        ? String(course.title_ar)
        : null;
  const courseEn = course.title != null ? String(course.title) : null;
  const courseTitle = pickLocalizedText(locale, courseAr, courseEn) || courseEn || courseAr || "";

  const lessonDenied =
    !isStaff &&
    !isEnrolled &&
    !hasFullStudentAccess &&
    allowedLessonIds.length > 0 &&
    !allowedLessonIds.includes(lessonId);

  if (lessonDenied) {
    return (
      <CourseContentAccessDenied
        title={t("courses.lessonAccessDeniedTitle", "You do not have access to this lesson")}
        message={t(
          "courses.lessonAccessDeniedMessage",
          "The code you redeemed unlocks only specific lessons in this course. To view this lesson, purchase the full course or redeem another code that includes it.",
        )}
        courseHref={courseHref(course)}
        courseTitle={courseTitle}
        backLabel={t("courses.backToCourse", "Back to")}
        purchaseCourseLabel={t("courses.purchaseCourseAction", "Purchase course")}
        activateCodeLabel={t("courses.activateAnotherCode", "Redeem another code")}
      />
    );
  }

  const progression = await resolveCourseProgression(
    session?.user?.id,
    role,
    hasFullStudentAccess,
    course.id,
    data.lessons as Record<string, unknown>[],
    data.quizzes as Record<string, unknown>[],
  );
  const progressionRow = findProgressionRowForLesson(progression, lessonId);
  if (
    shouldApplySequentialProgression(role, hasFullStudentAccess) &&
    progressionRow?.locked
  ) {
    notFound();
  }

  const videoUrl = (lessonObj.videoUrl ?? lessonObj.video_url) as string;
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const lessonAr =
    lessonObj.titleAr != null
      ? String(lessonObj.titleAr)
      : lessonObj.title_ar != null
        ? String(lessonObj.title_ar)
        : null;
  const lessonEn = lessonObj.title != null ? String(lessonObj.title) : null;
  const lessonTitle = pickLocalizedText(locale, lessonAr, lessonEn) || lessonEn || lessonAr || "";

  let studentCopyrightCode: string | null = null;
  if (session?.user?.role === "STUDENT" && session.user.id) {
    studentCopyrightCode = await ensureUserCopyrightCode(session.user.id);
  }
  const homepageSettings = await getHomepageSettings();
  const copyrightOverlayStyle =
    homepageSettings.copyrightOverlayStyle === "watermark" ? "watermark" : "floating";


  const navItems: NavItem[] = progression.rows.map((row) => {
    if (row.type === "lesson") {
      const l = row.lesson as Record<string, unknown> & { id: string; slug?: string | null };
      return {
        type: "lesson" as const,
        id: row.targetId,
        slug: l.slug ?? null,
        locked: row.locked,
      };
    }
    return { type: "quiz" as const, id: row.targetId, locked: row.locked };
  });
  const currentIndex = navItems.findIndex((i) => i.type === "lesson" && i.id === lessonId);
  const prevItem = currentIndex > 0 ? navItems[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < navItems.length - 1 ? navItems[currentIndex + 1] : null;

  const homeworkRequired = Boolean(lessonObj.acceptsHomework ?? lessonObj.accepts_homework);
  const videoComplete =
    session?.user?.id && isStudent
      ? await isLessonCompleteForUser(session.user.id, lessonId, course.id)
      : false;
  const homeworkSubmitted =
    session?.user?.id && isStudent && homeworkRequired
      ? await hasHomeworkSubmissionForLesson(session.user.id, lessonId)
      : !homeworkRequired;
  const lessonCompleted =
    session?.user?.id && isStudent
      ? (progressionRow?.completed ?? (videoComplete && homeworkSubmitted))
      : false;
  const canAutoComplete = isStudent && hasFullStudentAccess && !videoComplete;
  const nextHref = nextItem
    ? nextItem.type === "lesson"
      ? lessonHref(course, { id: nextItem.id, slug: nextItem.slug ?? undefined })
      : quizHref(course, nextItem.id)
    : null;
  const nextLabel = nextItem
    ? nextItem.type === "lesson"
      ? t("courses.nextLesson", "Next lesson")
      : t("courses.nextQuiz", "Next quiz")
    : null;

  const lessonContent = lessonObj.content
    ? prepareLessonContentForDisplay(String(lessonObj.content))
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link href={courseHref(course)} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          ← {t("courses.backToCourse", "Back to")} {courseTitle}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
        {/* محتوى الحصة — دائماً العمود العريض */}
        <article className="min-w-0 lg:col-start-1 lg:row-start-1">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{lessonTitle}</h1>

          <LessonWatchShell
            youtubeVideoId={youtubeVideoId}
            storageKey={String(lessonObj.id)}
            className="w-full"
            lessonId={lessonId}
            courseId={course.id}
            canAutoComplete={canAutoComplete}
            initialVideoComplete={videoComplete}
            homeworkRequired={homeworkRequired && isStudent && hasFullStudentAccess}
            initialHomeworkSubmitted={homeworkSubmitted}
            nextHref={isStudent && hasFullStudentAccess ? nextHref : null}
            nextLabel={isStudent && hasFullStudentAccess ? nextLabel : null}
            copyrightOverlay={
              studentCopyrightCode?.trim() ? (
                <VideoCopyrightOverlay
                  code={studentCopyrightCode.trim()}
                  label={t("video.copyrightCode", "Copyright code")}
                  dir="rtl"
                  style={copyrightOverlayStyle}
                />
              ) : undefined
            }
          >
            {(lessonObj.pdfUrl ?? lessonObj.pdf_url) ? (
              <div className="mt-6">
                <LessonAttachmentPreview
                  url={String(lessonObj.pdfUrl ?? lessonObj.pdf_url)}
                  viewLabel={t("courses.downloadPdf", "Download / View file")}
                  unavailableLabel={t(
                    "courses.filePreviewUnavailable",
                    "Preview is not available for this file type",
                  )}
                />
              </div>
            ) : null}

            {lessonContent?.value ? (
              <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 prose-custom text-[var(--color-foreground)]">
                {lessonContent.mode === "html" ? (
                  <div dangerouslySetInnerHTML={{ __html: lessonContent.value }} />
                ) : (
                  lessonContent.value.split("\n").map((paragraph, i) =>
                    paragraph.trim() ? <p key={i}>{paragraph}</p> : null,
                  )
                )}
              </div>
            ) : null}

            {homeworkRequired ? (
              <LessonHomeworkMaterialsPanel
                materials={parseHomeworkMaterials(
                  lessonObj.homeworkMaterials ?? lessonObj.homework_materials,
                )}
                explanationVideoUrl={
                  String(
                    lessonObj.homeworkExplanationVideoUrl ??
                      lessonObj.homework_explanation_video_url ??
                      "",
                  ).trim() || null
                }
                initialHomeworkSubmitted={homeworkSubmitted}
                forceShowExplanation={!isStudent}
              />
            ) : null}

            {homeworkRequired && (
              <LessonHomeworkSection lessonId={String(lessonObj.id)} required={isStudent && hasFullStudentAccess} />
            )}

            {isStudent ? <LessonRatingSection lessonId={String(lessonObj.id)} /> : null}
          </LessonWatchShell>

          {/* أزرار السابق والتالي أسفل الحصة */}
          <nav className="mt-8 flex w-full items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
            {prevItem && !prevItem.locked ? (
              <Link
                href={prevItem.type === "lesson" ? lessonHref(course, { id: prevItem.id, slug: prevItem.slug ?? undefined }) : quizHref(course, prevItem.id)}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-background)]"
              >
                ← {prevItem.type === "lesson"
                  ? t("courses.previousLesson", "Previous lesson")
                  : t("courses.previousQuiz", "Previous quiz")}
              </Link>
            ) : (
              <span />
            )}
            {(lessonCompleted || !isStudent) && nextItem && !nextItem.locked ? (
              <Link
                href={nextItem.type === "lesson" ? lessonHref(course, { id: nextItem.id, slug: nextItem.slug ?? undefined }) : quizHref(course, nextItem.id)}
                className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                {nextItem.type === "lesson"
                  ? t("courses.nextLesson", "Next lesson")
                  : t("courses.nextQuiz", "Next quiz")} →
              </Link>
            ) : null}
          </nav>
        </article>

        {/* قائمة الكورس — العمود الضيق على الجانب */}
        <aside className="order-first lg:col-start-2 lg:row-start-1 lg:order-none">
          <CourseOutlineSidebar
            course={{ id: course.id, slug: course.slug as string | null | undefined }}
            rows={progression.rows}
            canAccess
            currentLessonId={lessonId}
            currentQuizId={null}
          />
        </aside>
      </div>
    </div>
  );
}
