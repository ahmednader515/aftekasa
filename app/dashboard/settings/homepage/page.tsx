import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { HomepageSettingsForm } from "./HomepageSettingsForm";
import { getCoursesPublished, getHomepageSettings } from "@/lib/db";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function DashboardHomepageSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") redirect("/dashboard");
  const t = await getServerTranslator();

  const [settings, coursesResult] = await Promise.all([
    getHomepageSettings(),
    getCoursesPublished(true).catch(() => [] as Awaited<ReturnType<typeof getCoursesPublished>>),
  ]);
  let publishedCourses: { id: string; slug: string; title: string; titleAr: string | null }[] = [];
  try {
    publishedCourses = coursesResult.map((c) => {
      const titleArRaw = (c as { titleAr?: string | null }).titleAr ?? c.title_ar ?? null;
      const titleAr =
        titleArRaw != null && String(titleArRaw).trim() !== "" ? String(titleArRaw).trim() : null;
      return {
        id: String(c.id),
        slug: String(c.slug),
        title: String(c.title ?? ""),
        titleAr,
      };
    });
  } catch {
    /* قاعدة البيانات غير متصلة */
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboardNav.homepageSettings", "Homepage settings")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.homepageSettingsDescription",
          "Update homepage visuals and text in both Arabic and English.",
        )}
      </p>
      <HomepageSettingsForm initialSettings={settings} publishedCourses={publishedCourses} />
    </div>
  );
}
