import {
  createLesson,
  updateLesson,
  deleteLessonById,
  getLessonIdsByCourseId,
} from "./db";
import type { CourseContentOrderEntry } from "./save-course-quizzes";
import { serializeHomeworkMaterials, type HomeworkMaterial } from "./homework-materials";
import { buildLessonSlug, normalizeCourseSlug } from "./course-slug";

export type LessonSyncInput = {
  id?: string;
  title: string;
  titleAr?: string;
  videoUrl?: string;
  content?: string;
  pdfUrl?: string;
  isPublished?: boolean;
  acceptsHomework?: boolean;
  homeworkMaterials?: HomeworkMaterial[];
  homeworkExplanationVideoUrl?: string;
};

type LessonPayload = {
  title: string;
  title_ar: string | null;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  order: number;
  is_published: boolean;
  accepts_homework: boolean;
  homework_materials: string | null;
  homework_explanation_video_url: string | null;
};

/**
 * Sync lessons without hitting Lesson(course_id, slug) unique collisions.
 * Reordering / renumbering uses a temp-slug pass so two lessons never claim the same slug at once.
 */
export async function syncCourseLessons(params: {
  courseId: string;
  courseSlug: string;
  lessons: LessonSyncInput[];
  contentOrder: CourseContentOrderEntry[];
}): Promise<void> {
  const { courseId, courseSlug, lessons, contentOrder } = params;
  const normalizedCourseSlug = normalizeCourseSlug(courseSlug) || "course";
  const existingIds = new Set(await getLessonIdsByCourseId(courseId));
  const keptIds = new Set<string>();

  const updates: Array<{ id: string; index: number; payload: LessonPayload }> = [];
  const creates: Array<{ index: number; payload: LessonPayload }> = [];

  for (let i = 0; i < lessons.length; i++) {
    const le = lessons[i];
    const order = contentOrder.findIndex((e) => e.type === "lesson" && e.index === i);
    const orderVal = order >= 0 ? order : i;
    const lessonId = le.id?.trim();
    const payload: LessonPayload = {
      title: le.title?.trim() || `حصة ${i + 1}`,
      title_ar: le.titleAr?.trim() || null,
      content: le.content?.trim() || null,
      video_url: le.videoUrl?.trim() || null,
      pdf_url: le.pdfUrl?.trim() || null,
      order: orderVal,
      is_published: le.isPublished !== false,
      accepts_homework: !!le.acceptsHomework,
      homework_materials: serializeHomeworkMaterials(le.homeworkMaterials),
      homework_explanation_video_url: le.homeworkExplanationVideoUrl?.trim() || null,
    };

    if (lessonId && existingIds.has(lessonId)) {
      updates.push({ id: lessonId, index: i, payload });
      keptIds.add(lessonId);
    } else {
      creates.push({ index: i, payload });
    }
  }

  // Free slugs from removed lessons before renumbering.
  for (const id of existingIds) {
    if (!keptIds.has(id)) {
      await deleteLessonById(id);
    }
  }

  // Move kept lessons off target slugs (e.g. course1-4) so renumbering cannot collide.
  for (const u of updates) {
    await updateLesson(u.id, {
      ...u.payload,
      slug: `__sync-${u.id}`,
    });
  }

  for (const u of updates) {
    await updateLesson(u.id, {
      ...u.payload,
      slug: buildLessonSlug(normalizedCourseSlug, u.index + 1),
    });
  }

  for (const c of creates) {
    const created = await createLesson({
      course_id: courseId,
      ...c.payload,
      slug: buildLessonSlug(normalizedCourseSlug, c.index + 1),
    });
    keptIds.add(created.id);
  }
}
