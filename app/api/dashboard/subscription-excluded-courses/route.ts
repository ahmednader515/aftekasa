import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  listCoursesForSubscriptionExclusionAdmin,
  setCoursesExcludedFromSubscription,
} from "@/lib/db";

/** قائمة الكورسات المدفوعة + المستثناة من الاشتراك */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const courses = await listCoursesForSubscriptionExclusionAdmin();
    return NextResponse.json({
      courses,
      excludedCourseIds: courses.filter((c) => c.excludeFromSubscription).map((c) => c.id),
    });
  } catch (err) {
    console.error("[GET /api/dashboard/subscription-excluded-courses]", err);
    return NextResponse.json({ error: "فشل تحميل الكورسات" }, { status: 500 });
  }
}

/** حفظ الكورسات المستثناة من أي اشتراك */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: { courseIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.filter((id): id is string => typeof id === "string" && id.trim() !== "")
    : null;
  if (!courseIds) {
    return NextResponse.json({ error: "قائمة الكورسات مطلوبة" }, { status: 400 });
  }
  try {
    const saved = await setCoursesExcludedFromSubscription(courseIds);
    return NextResponse.json({ success: true, saved });
  } catch (err) {
    console.error("[PUT /api/dashboard/subscription-excluded-courses]", err);
    return NextResponse.json({ error: "فشل حفظ الاستثناءات" }, { status: 500 });
  }
}
