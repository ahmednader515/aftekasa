import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getGradeStageCategories } from "@/lib/db";
import { GRADE_STAGES, isGradeStageSlug, type GradeStageSlug } from "@/lib/grade-stages";
import { getServerTranslator } from "@/lib/i18n/server";
import { GradeStagesImagesForm, type GradeStageRow } from "./GradeStagesImagesForm";

export default async function DashboardGradeStagesSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  const categories = await getGradeStageCategories();
  const bySlug = new Map(
    categories.map((c) => [String((c as { slug?: string }).slug ?? ""), c] as const),
  );

  const initialStages: GradeStageRow[] = GRADE_STAGES.map((stage) => {
    const cat = bySlug.get(stage.slug);
    const row = (cat ?? {}) as unknown as Record<string, unknown>;
    const raw = row.imageUrl ?? row.image_url;
    const imageUrl = typeof raw === "string" && raw.trim() ? raw.trim() : "";
    return {
      id: String(row.id ?? ""),
      slug: stage.slug,
      nameAr: stage.nameAr,
      nameEn: stage.nameEn,
      shortLabel: stage.shortLabel,
      imageUrl,
    };
  }).filter((s) => s.id && isGradeStageSlug(s.slug as GradeStageSlug));

  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.gradeStagesPage.title", "Educational stage cards")}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        {t(
          "dashboard.gradeStagesPage.subtitle",
          "Set a separate portrait image for each educational stage card on the homepage.",
        )}
      </p>
      <GradeStagesImagesForm initialStages={initialStages} />
    </div>
  );
}
