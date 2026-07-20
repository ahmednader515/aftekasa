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

  for (let i = 0; i < lessons.length; i++) {
    const le = lessons[i];
    const order = contentOrder.findIndex((e) => e.type === "lesson" && e.index === i);
    const orderVal = order >= 0 ? order : i;
    const lessonId = le.id?.trim();
    const lessonSlug = buildLessonSlug(normalizedCourseSlug, i + 1);
    const payload = {
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
      await updateLesson(lessonId, {
        ...payload,
        slug: lessonSlug,
      });
      keptIds.add(lessonId);
    } else {
      const created = await createLesson({
        course_id: courseId,
        ...payload,
        slug: lessonSlug,
      });
      keptIds.add(created.id);
    }
  }

  for (const id of existingIds) {
    if (!keptIds.has(id)) {
      await deleteLessonById(id);
    }
  }
}
