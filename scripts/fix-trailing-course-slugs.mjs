/**
 * يصلح دورات ينتهي slug فيها بشرطة، ويحدّث slug الحصص تبعاً لذلك.
 * تشغيل: node scripts/fix-trailing-course-slugs.mjs
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL غير معرّف");
  process.exit(1);
}

const sql = neon(connectionString);

function normalizeSlug(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function uniqueCourseSlug(desired) {
  let candidate = desired || "course";
  let n = 2;
  while (true) {
    const rows = await sql`SELECT id FROM "Course" WHERE slug = ${candidate} LIMIT 1`;
    if (rows.length === 0) return candidate;
    candidate = `${desired}-${n}`;
    n += 1;
  }
}

const badCourses = await sql`
  SELECT id, slug, title, title_ar
  FROM "Course"
  WHERE slug LIKE '%-' OR slug LIKE '%--%'
`;

if (badCourses.length === 0) {
  console.log("لا توجد دورات بـ slug ينتهي بشرطة.");
} else {
  for (const course of badCourses) {
    const base = normalizeSlug(course.slug) || normalizeSlug(course.title) || "course";
    const newSlug = await uniqueCourseSlug(base);
    console.log(`Course ${course.id}: "${course.slug}" → "${newSlug}"`);
    await sql`UPDATE "Course" SET slug = ${newSlug} WHERE id = ${course.id}`;

    const lessons = await sql`
      SELECT id, slug, "order"
      FROM "Lesson"
      WHERE course_id = ${course.id}
      ORDER BY "order" ASC
    `;
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const newLessonSlug = `${newSlug}-${i + 1}`;
      console.log(`  Lesson ${lesson.id}: "${lesson.slug}" → "${newLessonSlug}"`);
      await sql`UPDATE "Lesson" SET slug = ${newLessonSlug} WHERE id = ${lesson.id}`;
    }
  }
}

const doubleHyphenLessons = await sql`
  SELECT id, slug, course_id
  FROM "Lesson"
  WHERE slug LIKE '%--%'
`;
if (doubleHyphenLessons.length > 0) {
  console.log(`حصص متبقية بـ -- : ${doubleHyphenLessons.length}`);
  for (const lesson of doubleHyphenLessons) {
    const courseRows = await sql`SELECT slug FROM "Course" WHERE id = ${lesson.course_id} LIMIT 1`;
    const courseSlug = normalizeSlug(courseRows[0]?.slug) || "course";
    const cleaned = lesson.slug.replace(/-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
    const fallback = cleaned.startsWith(courseSlug) ? cleaned : `${courseSlug}-fix`;
    let candidate = fallback;
    let n = 2;
    while (true) {
      const clash = await sql`
        SELECT id FROM "Lesson"
        WHERE course_id = ${lesson.course_id} AND slug = ${candidate} AND id <> ${lesson.id}
        LIMIT 1
      `;
      if (clash.length === 0) break;
      candidate = `${fallback}-${n}`;
      n += 1;
    }
    console.log(`  Lesson ${lesson.id}: "${lesson.slug}" → "${candidate}"`);
    await sql`UPDATE "Lesson" SET slug = ${candidate} WHERE id = ${lesson.id}`;
  }
}

console.log("تم.");
