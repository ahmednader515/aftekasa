/**
 * Database seed — runs against VPS/local Postgres via Prisma + lib/db helpers.
 * Setup: set DATABASE_URL, then `npx prisma db push` and `npm run db:seed`
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  getUserByEmail,
  createUser,
  getCategories,
  createCategory,
  createCourse,
  createLesson,
  ensureGradeCategories,
} from "../lib/db";

async function ensureDefaultHomepageSetting(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "HomepageSetting" (id, updated_at)
    VALUES ('default', NOW())
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("Ensured HomepageSetting id=default");
}

async function main() {
  await ensureDefaultHomepageSetting();

  try {
    await ensureGradeCategories();
    console.log("Ensured grade stage categories");
  } catch (e) {
    console.warn("ensureGradeCategories skipped:", e instanceof Error ? e.message : e);
  }

  const adminPassword = await hash("admin123", 12);
  const assistantPassword = await hash("assistant123", 12);

  if (!(await getUserByEmail("admin@example.com"))) {
    await createUser({
      email: "admin@example.com",
      password_hash: adminPassword,
      name: "مدير المنصة",
      role: "ADMIN",
    });
    console.log("Created admin user");
  }

  if (!(await getUserByEmail("assistant@example.com"))) {
    await createUser({
      email: "assistant@example.com",
      password_hash: assistantPassword,
      name: "مساعد المدير",
      role: "ASSISTANT_ADMIN",
    });
    console.log("Created assistant user");
  }

  const categories = await getCategories();
  const hasProgramming = categories.some((c: { slug?: string }) => c.slug === "programming");
  const hasDesign = categories.some((c: { slug?: string }) => c.slug === "design");

  let cat1 = categories.find((c: { slug?: string }) => c.slug === "programming");
  if (!cat1 && !hasProgramming) {
    cat1 = await createCategory({
      name: "Programming",
      name_ar: "البرمجة",
      slug: "programming",
      description: "دورات البرمجة وتطوير البرمجيات",
      order: 1,
    });
    console.log("Created category programming");
  }

  if (!hasDesign) {
    await createCategory({
      name: "Design",
      name_ar: "التصميم",
      slug: "design",
      description: "التصميم الجرافيكي والواجهات",
      order: 2,
    });
    console.log("Created category design");
  }

  const existingCourse = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id FROM "Course" WHERE slug = ${"nextjs-basics"} LIMIT 1`,
  );
  if (existingCourse.length === 0) {
    const course = await createCourse({
      title: "Next.js من الصفر",
      title_ar: "Next.js من الصفر",
      slug: "nextjs-basics",
      description:
        "تعلم بناء تطبيقات ويب حديثة باستخدام Next.js و React. نغطي التوجيه، جلب البيانات، والـ API Routes.",
      short_desc: "تعلم Next.js و React خطوة بخطوة",
      price: 0,
      is_published: true,
      created_by_id: (await getUserByEmail("admin@example.com"))!.id,
    });

    await createLesson({
      course_id: course.id,
      title: "مقدمة إلى Next.js",
      title_ar: "مقدمة إلى Next.js",
      slug: "intro-nextjs",
      content: "نظرة عامة على الإطار وكيفية إعداد المشروع.",
      order: 1,
    });
    await createLesson({
      course_id: course.id,
      title: "التوجيه (Routing)",
      title_ar: "التوجيه",
      slug: "routing",
      content: "App Router وملفات التوجيه الديناميكي.",
      order: 2,
    });
    console.log("Created sample course nextjs-basics");
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
