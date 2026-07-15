import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { getServerTranslator } from "@/lib/i18n/server";
import ForgotPasswordFormClient from "./ForgotPasswordFormClient";

export default async function ForgotPasswordPage() {
  const t = await getServerTranslator();

  return (
    <AuthSplitLayout
      welcomeTitle={t("auth.login.welcomeBackTitle", "Welcome back")}
      welcomeDescription={t(
        "auth.login.welcomeBackDescription",
        "Sign in and explore outstanding educational courses",
      )}
      backHref="/login"
    >
      <ForgotPasswordFormClient />
    </AuthSplitLayout>
  );
}
