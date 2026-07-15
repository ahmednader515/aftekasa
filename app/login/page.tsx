import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { getServerTranslator } from "@/lib/i18n/server";
import LoginFormClient from "./LoginFormClient";

export default async function LoginPage() {
  const t = await getServerTranslator();

  return (
    <AuthSplitLayout
      welcomeTitle={t("auth.login.welcomeBackTitle", "Welcome back")}
      welcomeDescription={t(
        "auth.login.welcomeBackDescription",
        "Sign in and explore outstanding educational courses",
      )}
    >
      <LoginFormClient />
    </AuthSplitLayout>
  );
}
