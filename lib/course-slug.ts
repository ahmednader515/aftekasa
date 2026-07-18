/** توحيد روابط الدورات والحصص — يمنع الشرطات الزائدة والازدواجية */

export function normalizeCourseSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function buildLessonSlug(courseSlug: string, lessonIndex1Based: number): string {
  const base = normalizeCourseSlug(courseSlug) || "lesson";
  return `${base}-${lessonIndex1Based}`;
}

/** مقطع الرابط للدورة — نستخدم الـ slug كما هو مخزّناً (بعد trim فقط) */
export function courseUrlSegment(course: { slug?: string | null; id: string }): string {
  const s = course.slug != null ? String(course.slug).trim() : "";
  return s ? encodeURIComponent(s) : course.id;
}
