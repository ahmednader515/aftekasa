import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getSubscriptionsFeatureEnabled,
  getCategories,
  listSubscriptionPlansAll,
  listCoursesForSubscriptionExclusionAdmin,
} from "@/lib/db";
import { isGradeStageSlug } from "@/lib/grade-stages";
import {
  SubscriptionsAdminClient,
  type AdminPlanRow,
  type AdminCategoryOption,
  type AdminExclusionCourse,
} from "./SubscriptionsAdminClient";

export default async function SubscriptionsDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const enabled = await getSubscriptionsFeatureEnabled();
  let plans: AdminPlanRow[] = [];
  let categories: AdminCategoryOption[] = [];
  let exclusionCourses: AdminExclusionCourse[] = [];
  try {
    const rows = await listSubscriptionPlansAll();
    plans = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      durationKind: r.durationKind,
      price: r.price,
      isActive: r.isActive,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      courseIds: r.courseIds ?? [],
    }));
    const cats = await getCategories();
    categories = cats
      .filter((c) => isGradeStageSlug(c.slug))
      .map((c) => ({
        id: c.id,
        name: (c as { nameAr?: string | null }).nameAr?.trim() || c.name,
      }));
    const courseRows = await listCoursesForSubscriptionExclusionAdmin();
    exclusionCourses = courseRows.map((c) => ({
      id: c.id,
      title: c.title,
      titleAr: c.titleAr,
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      categoryNameAr: c.categoryNameAr,
      price: c.price,
      excludeFromSubscription: c.excludeFromSubscription,
    }));
  } catch {
    plans = [];
    categories = [];
    exclusionCourses = [];
  }

  return (
    <SubscriptionsAdminClient
      initialEnabled={enabled}
      initialPlans={plans}
      categories={categories}
      initialExclusionCourses={exclusionCourses}
    />
  );
}
