import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";
import { CreateCourseForm } from "./CreateCourseForm";

export default async function NewCoursePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
    redirect("/dashboard");
  }
  const t = await getServerTranslator();

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {t("dashboard.backToDashboard")}
      </Link>
      <h2 className="mt-4 text-xl font-bold text-[var(--color-foreground)]">
        {t("dashboard.courseNewPage.title")}
      </h2>
      <CreateCourseForm />
    </div>
  );
}
